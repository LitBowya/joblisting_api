import express from "express";
import {
    createCompany,
    getMyCompany,
    updateCompany,
    deleteCompany,
    createJob,
    getMyJobs,
    getJobById,
    updateJob,
    deleteJob,
    addJobSkill,
    getJobSkills,
    deleteJobSkill,
    getJobApplications,
    getAllMyApplications,
} from "../controllers/recruiter.controller.js";
import { protect, recruiterOnly } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication AND recruiter role
router.use(protect, recruiterOnly);

// ==================== COMPANY ROUTES ====================
// Create company profile
router.post("/company", createCompany);

// Get current recruiter's company
router.get("/company", getMyCompany);

// Update company profile
router.put("/company", updateCompany);

// Delete company profile
router.delete("/company", deleteCompany);

// ==================== JOB ROUTES ====================
// Create job posting
router.post("/jobs", createJob);

// Get all jobs by current recruiter (with pagination & filters)
router.get("/jobs", getMyJobs);

// Get single job by ID
router.get("/jobs/:id", getJobById);

// Update job
router.put("/jobs/:id", updateJob);

// Delete job
router.delete("/jobs/:id", deleteJob);

// ==================== JOB SKILLS ROUTES ====================
// Add skill to job
router.post("/jobs/:id/skills", addJobSkill);

// Get all skills for a job
router.get("/jobs/:id/skills", getJobSkills);

// Delete skill from job
router.delete("/jobs/:jobId/skills/:skillId", deleteJobSkill);

// ==================== APPLICATION MANAGEMENT ROUTES ====================
// Get all applications for a specific job (with pagination & filters)
router.get("/jobs/:id/applications", getJobApplications);

// Get all applications across all jobs (with pagination & filters)
router.get("/applications", getAllMyApplications);

export default router;
