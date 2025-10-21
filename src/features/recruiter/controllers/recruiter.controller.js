import { db } from "../../../shared/db/index.js";
import {
    companiesTable,
    jobsTable,
    jobSkillsTable,
    jobApplicationsTable,
} from "../../../shared/models/recruiter.model.js";
import { usersTable } from "../../../shared/models/user.model.js";
import { jobSeekerProfilesTable } from "../../../shared/models/jobSeeker.model.js";
import {
    createCompanySchema,
    updateCompanySchema,
    createJobSchema,
    updateJobSchema,
    addJobSkillSchema,
    updateApplicationStatusSchema,
} from "../validations/recruiter.validation.js";
import { isCompanyOwner, getCompanyByUserId } from "../utils/recruiter.util.js";
import { eq, and, desc, sql, or, ilike } from "drizzle-orm";
import {getUserById} from "../../user/utils/user.util.js";
import { sendApplicationStatusUpdateEmail } from "../../../shared/services/email.service.js";
import {formatZodErrorMessage} from "../../../shared/utils/formatZodErrorMessage.js"

// ==================== COMPANY MANAGEMENT ====================

/**
 * Create Company Profile
 * POST /recruiter/company
 */
export const createCompany = async (req, res) => {
    try {
        // Validate input
        const result = createCompanySchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;


        // Check if user already has a company
        const existingCompany = await getCompanyByUserId(userId);
        if (existingCompany) {
            return res.status(400).json({
                message: "You already have a company profile. Please update it instead.",
            });
        }

        // Create company
        const [company] = await db
            .insert(companiesTable)
            .values({
                userId,
                ...result.data,
            })
            .returning();


        res.status(201).json({
            message: "Company profile created successfully",
            company,
        });
    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({
            message: "Error creating company profile",
            error: error.message,
        });
    }
};

/**
 * Get Company Profile (Current Recruiter)
 * GET /recruiter/company
 */
export const getMyCompany = async (req, res) => {
    try {
        const userId = req.user.id;

        const company = await getCompanyByUserId(userId);

        if (!company) {
            return res.status(404).json({
                message: "Company profile not found. Please create one first.",
            });
        }

        res.status(200).json({
            message: "Company profile retrieved successfully",
            company,
        });
    } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({
            message: "Error fetching company profile",
            error: error.message,
        });
    }
};

/**
 * Update Company Profile
 * PUT /recruiter/company
 */
export const updateCompany = async (req, res) => {
    try {
        // Validate input
        const result = updateCompanySchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;

        // Get company
        const company = await getCompanyByUserId(userId);
        if (!company) {
            return res.status(404).json({
                message: "Company profile not found. Please create one first.",
            });
        }

        // Update company
        const [updatedCompany] = await db
            .update(companiesTable)
            .set({
                ...result.data,
                updatedAt: new Date(),
            })
            .where(eq(companiesTable.id, company.id))
            .returning();


        res.status(200).json({
            message: "Company profile updated successfully",
            company: updatedCompany,
        });
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({
            message: "Error updating company profile",
            error: error.message,
        });
    }
};

/**
 * Delete Company Profile (and all associated jobs)
 * DELETE /recruiter/company
 */
export const deleteCompany = async (req, res) => {
    try {
        const userId = req.user.id;

        const company = await getCompanyByUserId(userId);
        if (!company) {
            return res.status(404).json({
                message: "Company profile not found",
            });
        }

        // Delete company (cascade will delete jobs, job_skills, and applications)
        await db.delete(companiesTable).where(eq(companiesTable.id, company.id));


        res.status(200).json({
            message: "Company profile and all associated jobs deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({
            message: "Error deleting company profile",
            error: error.message,
        });
    }
};

// ==================== JOB MANAGEMENT ====================

/**
 * Create Job Posting
 * POST /recruiter/jobs
 */
export const createJob = async (req, res) => {
    try {
        // Validate input
        const result = createJobSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;
        const { companyId, ...jobData } = result.data;

        // Verify company ownership
        const isOwner = await isCompanyOwner(userId, companyId);
        if (!isOwner) {
            return res.status(403).json({
                message: "You don't have permission to post jobs for this company",
            });
        }

        // Create job
        const [job] = await db
            .insert(jobsTable)
            .values({
                companyId,
                recruiterId: userId,
                ...jobData,
            })
            .returning();


        res.status(201).json({
            message: "Job posted successfully",
            job,
        });
    } catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({
            message: "Error creating job posting",
            error: error.message,
        });
    }
};

/**
 * Get All Jobs by Current Recruiter
 * GET /recruiter/jobs
 */
export const getMyJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        let query = db
            .select({
                job: jobsTable,
                company: {
                    id: companiesTable.id,
                    companyName: companiesTable.companyName,
                    location: companiesTable.location,
                },
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobsTable.recruiterId, userId))
            .orderBy(desc(jobsTable.createdAt))
            .limit(parseInt(limit))
            .offset(offset);

        // Add status filter if provided
        if (status && ["open", "closed", "draft"].includes(status)) {
            query = db
                .select({
                    job: jobsTable,
                    company: {
                        id: companiesTable.id,
                        companyName: companiesTable.companyName,
                        location: companiesTable.location,
                    },
                })
                .from(jobsTable)
                .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
                .where(
                    and(
                        eq(jobsTable.recruiterId, userId),
                        eq(jobsTable.status, status)
                    )
                )
                .orderBy(desc(jobsTable.createdAt))
                .limit(parseInt(limit))
                .offset(offset);
        }

        const jobs = await query;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql`count(*)::int` })
            .from(jobsTable)
            .where(eq(jobsTable.recruiterId, userId));

        res.status(200).json({
            message: "Jobs retrieved successfully",
            jobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalJobs: count,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({
            message: "Error fetching jobs",
            error: error.message,
        });
    }
};

/**
 * Get Single Job by ID
 * GET /recruiter/jobs/:id
 */
export const getJobById = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        const [result] = await db
            .select({
                job: jobsTable,
                company: companiesTable,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!result) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        // Verify ownership
        if (result.job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to view this job",
            });
        }

        // Get job skills
        const skills = await db
            .select()
            .from(jobSkillsTable)
            .where(eq(jobSkillsTable.jobId, jobId));

        res.status(200).json({
            message: "Job retrieved successfully",
            job: result.job,
            company: result.company,
            skills,
        });
    } catch (error) {
        console.error("Error fetching job:", error);
        res.status(500).json({
            message: "Error fetching job",
            error: error.message,
        });
    }
};

/**
 * Update Job
 * PUT /recruiter/jobs/:id
 */
export const updateJob = async (req, res) => {
    try {
        // Validate input
        const result = updateJobSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        // Get job
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        // Verify ownership
        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to update this job",
            });
        }

        // Update job
        const [updatedJob] = await db
            .update(jobsTable)
            .set({
                ...result.data,
                updatedAt: new Date(),
            })
            .where(eq(jobsTable.id, jobId))
            .returning();

        res.status(200).json({
            message: "Job updated successfully",
            job: updatedJob,
        });
    } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({
            message: "Error updating job",
            error: error.message,
        });
    }
};

/**
 * Delete Job
 * DELETE /recruiter/jobs/:id
 */
export const deleteJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        // Get job
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        // Verify ownership
        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to delete this job",
            });
        }

        // Delete job (cascade will delete job_skills and applications)
        await db.delete(jobsTable).where(eq(jobsTable.id, jobId));

        res.status(200).json({
            message: "Job deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({
            message: "Error deleting job",
            error: error.message,
        });
    }
};

// ==================== JOB SKILLS MANAGEMENT ====================

/**
 * Add Skill to Job
 * POST /recruiter/jobs/:id/skills
 */
export const addJobSkill = async (req, res) => {
    try {
        // Validate input
        const result = addJobSkillSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        // Get job and verify ownership
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to modify this job",
            });
        }

        // Check if skill already exists for this job
        const [existingSkill] = await db
            .select()
            .from(jobSkillsTable)
            .where(
                and(
                    eq(jobSkillsTable.jobId, jobId),
                    eq(jobSkillsTable.skillName, result.data.skillName)
                )
            )
            .limit(1);

        if (existingSkill) {
            return res.status(400).json({
                message: "This skill is already added to the job",
            });
        }

        // Add skill
        const [skill] = await db
            .insert(jobSkillsTable)
            .values({
                jobId,
                ...result.data,
            })
            .returning();

        res.status(201).json({
            message: "Skill added to job successfully",
            skill,
        });
    } catch (error) {
        console.error("Error adding job skill:", error);
        res.status(500).json({
            message: "Error adding skill to job",
            error: error.message,
        });
    }
};

/**
 * Get All Skills for a Job
 * GET /recruiter/jobs/:id/skills
 */
export const getJobSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        // Verify job ownership
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to view this job",
            });
        }

        // Get skills
        const skills = await db
            .select()
            .from(jobSkillsTable)
            .where(eq(jobSkillsTable.jobId, jobId));

        res.status(200).json({
            message: "Job skills retrieved successfully",
            skills,
        });
    } catch (error) {
        console.error("Error fetching job skills:", error);
        res.status(500).json({
            message: "Error fetching job skills",
            error: error.message,
        });
    }
};

/**
 * Delete Job Skill
 * DELETE /recruiter/jobs/:jobId/skills/:skillId
 */
export const deleteJobSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.jobId);
        const skillId = parseInt(req.params.skillId);

        // Verify job ownership
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to modify this job",
            });
        }

        // Delete skill
        const deletedSkill = await db
            .delete(jobSkillsTable)
            .where(
                and(
                    eq(jobSkillsTable.id, skillId),
                    eq(jobSkillsTable.jobId, jobId)
                )
            )
            .returning();

        if (deletedSkill.length === 0) {
            return res.status(404).json({
                message: "Skill not found for this job",
            });
        }

        res.status(200).json({
            message: "Skill removed from job successfully",
        });
    } catch (error) {
        console.error("Error deleting job skill:", error);
        res.status(500).json({
            message: "Error removing skill from job",
            error: error.message,
        });
    }
};

// ==================== APPLICATION MANAGEMENT ====================

/**
 * Get All Applications for a Job
 * GET /recruiter/jobs/:id/applications
 */
export const getJobApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.id);
        const { status, page = 1, limit = 10 } = req.query;

        // Verify job ownership
        const [job] = await db
            .select()
            .from(jobsTable)
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (job.recruiterId !== userId) {
            return res.status(403).json({
                message: "You don't have permission to view applications for this job",
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        let whereCondition = eq(jobApplicationsTable.jobId, jobId);
        if (status && ["pending", "reviewed", "shortlisted", "rejected", "accepted"].includes(status)) {
            whereCondition = and(
                eq(jobApplicationsTable.jobId, jobId),
                eq(jobApplicationsTable.status, status)
            );
        }

        // Get applications with applicant details
        const applications = await db
            .select({
                application: jobApplicationsTable,
                applicant: {
                    id: usersTable.id,
                    name: usersTable.name,
                    email: usersTable.email,
                },
                profile: jobSeekerProfilesTable,
            })
            .from(jobApplicationsTable)
            .innerJoin(usersTable, eq(jobApplicationsTable.jobSeekerId, usersTable.id))
            .leftJoin(jobSeekerProfilesTable, eq(usersTable.id, jobSeekerProfilesTable.userId))
            .where(whereCondition)
            .orderBy(desc(jobApplicationsTable.appliedAt))
            .limit(parseInt(limit))
            .offset(offset);

        // Get total count
        const [{ count }] = await db
            .select({ count: sql`count(*)::int` })
            .from(jobApplicationsTable)
            .where(whereCondition);

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalApplications: count,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({
            message: "Error fetching applications",
            error: error.message,
        });
    }
};

/**
 * Get All Applications Across All Jobs
 * GET /recruiter/applications
 */
export const getAllMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build where condition
        let whereCondition = eq(jobsTable.recruiterId, userId);
        if (status && ["pending", "reviewed", "shortlisted", "rejected", "accepted"].includes(status)) {
            whereCondition = and(
                eq(jobsTable.recruiterId, userId),
                eq(jobApplicationsTable.status, status)
            );
        }

        // Get applications
        const applications = await db
            .select({
                application: jobApplicationsTable,
                job: {
                    id: jobsTable.id,
                    title: jobsTable.title,
                    status: jobsTable.status,
                },
                company: {
                    id: companiesTable.id,
                    companyName: companiesTable.companyName,
                },
                applicant: {
                    id: usersTable.id,
                    name: usersTable.name,
                    email: usersTable.email,
                },
            })
            .from(jobApplicationsTable)
            .innerJoin(jobsTable, eq(jobApplicationsTable.jobId, jobsTable.id))
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .innerJoin(usersTable, eq(jobApplicationsTable.jobSeekerId, usersTable.id))
            .where(whereCondition)
            .orderBy(desc(jobApplicationsTable.appliedAt))
            .limit(parseInt(limit))
            .offset(offset);

        // Get total count
        const [{ count }] = await db
            .select({ count: sql`count(*)::int` })
            .from(jobApplicationsTable)
            .innerJoin(jobsTable, eq(jobApplicationsTable.jobId, jobsTable.id))
            .where(whereCondition);

        res.status(200).json({
            message: "All applications retrieved successfully",
            applications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalApplications: count,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error fetching all applications:", error);
        res.status(500).json({
            message: "Error fetching applications",
            error: error.message,
        });
    }
};
