import { db } from "../../../shared/db/index.js";
import {
    jobSeekerProfilesTable,
    skillsTable,
} from "../../../shared/models/jobSeeker.model.js";
import {
    jobsTable,
    companiesTable,
    jobSkillsTable,
    jobApplicationsTable,
} from "../../../shared/models/recruiter.model.js";
import { usersTable } from "../../../shared/models/user.model.js";
import {
    createProfileSchema,
    updateProfileSchema,
    addSkillSchema,
    updateSkillSchema,
} from "../validations/jobSeeker.validation.js";
import { getProfileByUserId, getProfileSkills } from "../utils/jobSeeker.util.js";
import { eq, and, desc, sql, or, ilike, inArray } from "drizzle-orm";
import { sendApplicationStatusUpdateEmail } from "../../../shared/services/email.service.js";
import {formatZodErrorMessage} from "../../../shared/utils/formatZodErrorMessage.js"
// ==================== PROFILE MANAGEMENT ====================

/**
 * Create Job Seeker Profile
 * POST /job-seeker/profile
 */
export const createProfile = async (req, res) => {
    try {
        // Validate input
        const result = createProfileSchema.safeParse(req.body);
        if (!result.success) {
                    const message = formatZodErrorMessage(result.error);
                    return res.status(400).json({ message });
                }

        const userId = req.user.id;

        // Check if user already has a profile
        const existingProfile = await getProfileByUserId(userId);
        if (existingProfile) {
            return res.status(400).json({
                message: "You already have a profile. Please update it instead.",
            });
        }

        // Create profile
        const [profile] = await db
            .insert(jobSeekerProfilesTable)
            .values({
                userId,
                ...result.data,
            })
            .returning();


        res.status(201).json({
            message: "Profile created successfully",
            profile,
        });
    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({
            message: "Error creating profile",
            error: error.message,
        });
    }
};

/**
 * Get My Profile
 * GET /job-seeker/profile
 */
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await getProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create one first.",
            });
        }

        // Get skills
        const skills = await getProfileSkills(profile.id);

        res.status(200).json({
            message: "Profile retrieved successfully",
            profile,
            skills,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
            message: "Error fetching profile",
            error: error.message,
        });
    }
};

/**
 * Update Profile
 * PUT /job-seeker/profile
 */
export const updateProfile = async (req, res) => {
    try {
        // Validate input
        const result = updateProfileSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;

        // Get profile
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create one first.",
            });
        }

        // Update profile
        const [updatedProfile] = await db
            .update(jobSeekerProfilesTable)
            .set({
                ...result.data,
                updatedAt: new Date(),
            })
            .where(eq(jobSeekerProfilesTable.id, profile.id))
            .returning();


        res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            message: "Error updating profile",
            error: error.message,
        });
    }
};

/**
 * Delete Profile (and all skills)
 * DELETE /job-seeker/profile
 */
export const deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found",
            });
        }

        // Delete profile (cascade will delete skills)
        await db
            .delete(jobSeekerProfilesTable)
            .where(eq(jobSeekerProfilesTable.id, profile.id));


        res.status(200).json({
            message: "Profile and all associated skills deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting profile:", error);
        res.status(500).json({
            message: "Error deleting profile",
            error: error.message,
        });
    }
};

// ==================== SKILLS MANAGEMENT ====================

/**
 * Add Skill to Profile
 * POST /job-seeker/skills
 */
export const addSkill = async (req, res) => {
    try {
        // Validate input
        const result = addSkillSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;

        // Get profile
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create a profile first.",
            });
        }

        // Check if skill already exists
        const [existingSkill] = await db
            .select()
            .from(skillsTable)
            .where(
                and(
                    eq(skillsTable.profileId, profile.id),
                    eq(skillsTable.skillName, result.data.skillName)
                )
            )
            .limit(1);

        if (existingSkill) {
            return res.status(400).json({
                message: "This skill is already in your profile",
            });
        }

        // Add skill
        const [skill] = await db
            .insert(skillsTable)
            .values({
                profileId: profile.id,
                ...result.data,
            })
            .returning();


        res.status(201).json({
            message: "Skill added successfully",
            skill,
        });
    } catch (error) {
        console.error("Error adding skill:", error);
        res.status(500).json({
            message: "Error adding skill",
            error: error.message,
        });
    }
};

/**
 * Get All My Skills
 * GET /job-seeker/skills
 */
export const getMySkills = async (req, res) => {
    try {
        const userId = req.user.id;

        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create a profile first.",
            });
        }

        const skills = await getProfileSkills(profile.id);

        res.status(200).json({
            message: "Skills retrieved successfully",
            skills,
        });
    } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({
            message: "Error fetching skills",
            error: error.message,
        });
    }
};

/**
 * Update Skill
 * PUT /job-seeker/skills/:id
 */
export const updateSkill = async (req, res) => {
    try {
        // Validate input
        const result = updateSkillSchema.safeParse(req.body);
        if (!result.success) {
            const message = formatZodErrorMessage(result.error);
            return res.status(400).json({ message });
        }

        const userId = req.user.id;
        const skillId = parseInt(req.params.id);

        // Get profile
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found",
            });
        }

        // Verify skill ownership
        const [skill] = await db
            .select()
            .from(skillsTable)
            .where(eq(skillsTable.id, skillId))
            .limit(1);

        if (!skill) {
            return res.status(404).json({
                message: "Skill not found",
            });
        }

        if (skill.profileId !== profile.id) {
            return res.status(403).json({
                message: "You don't have permission to update this skill",
            });
        }

        // Update skill
        const [updatedSkill] = await db
            .update(skillsTable)
            .set(result.data)
            .where(eq(skillsTable.id, skillId))
            .returning();


        res.status(200).json({
            message: "Skill updated successfully",
            skill: updatedSkill,
        });
    } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({
            message: "Error updating skill",
            error: error.message,
        });
    }
};

/**
 * Delete Skill
 * DELETE /job-seeker/skills/:id
 */
export const deleteSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const skillId = parseInt(req.params.id);

        // Get profile
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found",
            });
        }

        // Verify skill ownership and delete
        const deletedSkill = await db
            .delete(skillsTable)
            .where(
                and(
                    eq(skillsTable.id, skillId),
                    eq(skillsTable.profileId, profile.id)
                )
            )
            .returning();

        if (deletedSkill.length === 0) {
            return res.status(404).json({
                message: "Skill not found or doesn't belong to your profile",
            });
        }


        res.status(200).json({
            message: "Skill deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({
            message: "Error deleting skill",
            error: error.message,
        });
    }
};

// ==================== JOB DISCOVERY & SEARCH ====================
/**
 * Get All Jobs
 * GET /job-seeker/jobs
 */
export const getJobs = async (req, res) => {
    try {
        // Optional filters
        const { title, companyId, location } = req.query;

        // Base query
        let query = db
            .select({
                job: jobsTable,
                company: companiesTable,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id));

        // Apply optional filters
        if (title) {
            query = query.where(sql`${jobsTable.title} ILIKE ${'%' + title + '%'}`);
        }

        if (companyId) {
            query = query.where(eq(jobsTable.companyId, parseInt(companyId)));
        }

        if (location) {
            query = query.where(sql`${companiesTable.location} ILIKE ${'%' + location + '%'}`);
        }

        // Fetch jobs with company
        const results = await query;

        // Get all job IDs for skills lookup
        const jobIds = results.map((r) => r.job.id);
        let skillsByJob = {};

        if (jobIds.length > 0) {
            const jobSkills = await db
                .select()
                .from(jobSkillsTable)
                .where(inArray(jobSkillsTable.jobId, jobIds));

            // Group skills by jobId
            skillsByJob = jobSkills.reduce((acc, s) => {
                if (!acc[s.jobId]) acc[s.jobId] = [];
                acc[s.jobId].push(s);
                return acc;
            }, {});
        }

        // Fetch application counts
        const appCounts =
            jobIds.length > 0
                ? await db
                      .select({
                          jobId: jobApplicationsTable.jobId,
                          count: sql`count(*)::int`,
                      })
                      .from(jobApplicationsTable)
                      .where(inArray(jobApplicationsTable.jobId, jobIds))
                      .groupBy(jobApplicationsTable.jobId)
                : [];

        const countByJob = Object.fromEntries(appCounts.map((a) => [a.jobId, a.count]));

        // Combine all
        const jobs = results.map((r) => ({
            ...r.job,
            company: r.company,
            skills: skillsByJob[r.job.id] || [],
            applicationCount: countByJob[r.job.id] || 0,
        }));

        res.status(200).json({
            message: "Jobs retrieved successfully",
            total: jobs.length,
            jobs,
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
 * Search Jobs (Public - All Job Seekers)
 * GET /job-seeker/jobs/search
 */
export const searchJobs = async (req, res) => {
    try {
        const {
            search,
            location,
            jobType,
            locationType,
            skills,
            page = 1,
            limit = 10,
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build WHERE conditions
        let whereConditions = [eq(jobsTable.status, "open")];

        // Text search in title and description
        if (search) {
            whereConditions.push(
                or(
                    ilike(jobsTable.title, `%${search}%`),
                    ilike(jobsTable.description, `%${search}%`)
                )
            );
        }

        // Location filter
        if (location) {
            whereConditions.push(ilike(jobsTable.location, `%${location}%`));
        }

        // Job type filter
        if (jobType && ["full_time", "part_time", "contract", "internship", "freelance"].includes(jobType)) {
            whereConditions.push(eq(jobsTable.jobType, jobType));
        }

        // Location type filter
        if (locationType && ["on_site", "remote", "hybrid"].includes(locationType)) {
            whereConditions.push(eq(jobsTable.locationType, locationType));
        }

        // Skill-based filtering (if skills provided as comma-separated string)
        let jobsWithSkills = null;
        if (skills) {
            const skillArray = skills.split(",").map(s => s.trim());

            // Find jobs that have ANY of the specified skills
            const jobsMatchingSkills = await db
                .select({ jobId: jobSkillsTable.jobId })
                .from(jobSkillsTable)
                .where(
                    or(...skillArray.map(skill => ilike(jobSkillsTable.skillName, `%${skill}%`)))
                )
                .groupBy(jobSkillsTable.jobId);

            const jobIds = jobsMatchingSkills.map(j => j.jobId);

            if (jobIds.length > 0) {
                whereConditions.push(inArray(jobsTable.id, jobIds));
            } else {
                // No jobs match the skills, return empty result
                return res.status(200).json({
                    message: "Jobs retrieved successfully",
                    jobs: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalJobs: 0,
                        limit: parseInt(limit),
                    },
                });
            }
        }

        // Combine all conditions
        const whereClause = whereConditions.length > 1
            ? and(...whereConditions)
            : whereConditions[0];

        // Get jobs with company info
        const jobs = await db
            .select({
                job: jobsTable,
                company: {
                    id: companiesTable.id,
                    companyName: companiesTable.companyName,
                    industry: companiesTable.industry,
                    location: companiesTable.location,
                },
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(whereClause)
            .orderBy(desc(jobsTable.createdAt))
            .limit(parseInt(limit))
            .offset(offset);

        // Get skills for each job
        const jobsWithSkillsData = await Promise.all(
            jobs.map(async (item) => {
                const skills = await db
                    .select()
                    .from(jobSkillsTable)
                    .where(eq(jobSkillsTable.jobId, item.job.id));

                return {
                    ...item,
                    skills,
                };
            })
        );

        // Get total count
        const [{ count }] = await db
            .select({ count: sql`count(*)::int` })
            .from(jobsTable)
            .where(whereClause);

        res.status(200).json({
            message: "Jobs retrieved successfully",
            jobs: jobsWithSkillsData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalJobs: count,
                limit: parseInt(limit),
            },
            filters: {
                search: search || null,
                location: location || null,
                jobType: jobType || null,
                locationType: locationType || null,
                skills: skills || null,
            },
        });
    } catch (error) {
        console.error("Error searching jobs:", error);
        res.status(500).json({
            message: "Error searching jobs",
            error: error.message,
        });
    }
};

/**
 * Get Job Details by ID
 * GET /job-seeker/jobs/:id
 */
export const getJobDetails = async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);

        // Get job with company info
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

        // Get job skills
        const skills = await db
            .select()
            .from(jobSkillsTable)
            .where(eq(jobSkillsTable.jobId, jobId));

        // Get application count (for transparency)
        const [{ count }] = await db
            .select({ count: sql`count(*)::int` })
            .from(jobApplicationsTable)
            .where(eq(jobApplicationsTable.jobId, jobId));

        res.status(200).json({
            message: "Job details retrieved successfully",
            job: result.job,
            company: result.company,
            skills,
            applicationCount: count,
        });
    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).json({
            message: "Error fetching job details",
            error: error.message,
        });
    }
};

/**
 * Get Recommended Jobs (Based on User Skills)
 * GET /job-seeker/jobs/recommended
 */
export const getRecommendedJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get user profile and skills
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found. Please create a profile first.",
            });
        }

        const userSkills = await getProfileSkills(profile.id);

        if (userSkills.length === 0) {
            return res.status(200).json({
                message: "Add skills to your profile to get job recommendations",
                jobs: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalJobs: 0,
                    limit: parseInt(limit),
                },
            });
        }

        // Get job IDs that match user skills
        const skillNames = userSkills.map(s => s.skillName);
        const jobsMatchingSkills = await db
            .select({
                jobId: jobSkillsTable.jobId,
                matchCount: sql`count(*)::int`.as('matchCount')
            })
            .from(jobSkillsTable)
            .where(
                and(
                    or(...skillNames.map(skill => ilike(jobSkillsTable.skillName, `%${skill}%`))),
                )
            )
            .groupBy(jobSkillsTable.jobId)
            .orderBy(desc(sql`count(*)`)); // Order by number of matching skills

        const jobIds = jobsMatchingSkills.map(j => j.jobId);

        if (jobIds.length === 0) {
            return res.status(200).json({
                message: "No matching jobs found for your skills",
                jobs: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalJobs: 0,
                    limit: parseInt(limit),
                },
            });
        }

        // Get jobs
        const jobs = await db
            .select({
                job: jobsTable,
                company: {
                    id: companiesTable.id,
                    companyName: companiesTable.companyName,
                    industry: companiesTable.industry,
                    location: companiesTable.location,
                },
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(
                and(
                    inArray(jobsTable.id, jobIds),
                    eq(jobsTable.status, "open")
                )
            )
            .limit(parseInt(limit))
            .offset(offset);

        // Get skills for each job and calculate match percentage
        const jobsWithMatch = await Promise.all(
            jobs.map(async (item) => {
                const jobSkills = await db
                    .select()
                    .from(jobSkillsTable)
                    .where(eq(jobSkillsTable.jobId, item.job.id));

                // Calculate skill match percentage
                const matchingSkillsCount = jobSkills.filter(js =>
                    userSkills.some(us =>
                        us.skillName.toLowerCase() === js.skillName.toLowerCase()
                    )
                ).length;

                const matchPercentage = jobSkills.length > 0
                    ? Math.round((matchingSkillsCount / jobSkills.length) * 100)
                    : 0;

                return {
                    ...item,
                    skills: jobSkills,
                    matchPercentage,
                    matchingSkillsCount,
                };
            })
        );

        // Sort by match percentage
        jobsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

        res.status(200).json({
            message: "Recommended jobs retrieved successfully",
            jobs: jobsWithMatch,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(jobIds.length / parseInt(limit)),
                totalJobs: jobIds.length,
                limit: parseInt(limit),
            },
            userSkillsCount: userSkills.length,
        });
    } catch (error) {
        console.error("Error fetching recommended jobs:", error);
        res.status(500).json({
            message: "Error fetching recommended jobs",
            error: error.message,
        });
    }
};

// ==================== JOB APPLICATIONS ====================

/**
 * Apply to Job
 * POST /job-seeker/jobs/:id/apply
 */
export const applyToJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const jobId = parseInt(req.params.id);

        // Check if job exists and is open, also fetch company details
        const [jobData] = await db
            .select({
                job: jobsTable,
                company: companiesTable,
            })
            .from(jobsTable)
            .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
            .where(eq(jobsTable.id, jobId))
            .limit(1);

        if (!jobData) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (jobData.job.status !== "open") {
            return res.status(400).json({
                message: "This job is no longer accepting applications",
            });
        }

        // Check if already applied
        const [existingApplication] = await db
            .select()
            .from(jobApplicationsTable)
            .where(
                and(
                    eq(jobApplicationsTable.jobId, jobId),
                    eq(jobApplicationsTable.jobSeekerId, userId)
                )
            )
            .limit(1);

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied to this job",
                application: existingApplication,
            });
        }

        // Get user details for email
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        // Create application
        const [application] = await db
            .insert(jobApplicationsTable)
            .values({
                jobId,
                jobSeekerId: userId,
                status: "pending",
            })
            .returning();


        // Send email notification to job seeker
        try {
            await sendApplicationStatusUpdateEmail(
                user.email,
                user.name,
                jobData.job.title,
                jobData.company.companyName,
                "pending"
            );
        } catch (emailError) {
            console.error("Error sending application confirmation email:", emailError);
            // Continue even if email fails - the application was successful
        }

        res.status(201).json({
            message: "Application submitted successfully",
            application,
        });
    } catch (error) {
        console.error("Error applying to job:", error);
        res.status(500).json({
            message: "Error submitting application",
            error: error.message,
        });
    }
};