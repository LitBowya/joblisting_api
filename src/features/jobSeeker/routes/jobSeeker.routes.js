import express from "express";
import {
    createProfile,
    getMyProfile,
    updateProfile,
    deleteProfile,
    addSkill,
    getMySkills,
    updateSkill,
    deleteSkill,
    getJobs,
    searchJobs,
    getJobDetails,
    getRecommendedJobs,
    applyToJob,
} from "../controllers/jobSeeker.controller.js";
import { protect, jobSeekerOnly } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();


// ==================== PROFILE ROUTES ====================
// Create job seeker profile
router.post("/profile",protect, jobSeekerOnly, createProfile);

// Get current job seeker's profile
router.get("/profile",protect, jobSeekerOnly, getMyProfile);

// Update profile
router.put("/profile",protect, jobSeekerOnly, updateProfile);

// Delete profile
router.delete("/profile",protect, jobSeekerOnly, deleteProfile);

// ==================== SKILLS ROUTES ====================
// Add skill to profile
router.post("/skills",protect, jobSeekerOnly, addSkill);

// Get all my skills
router.get("/skills",protect, jobSeekerOnly, getMySkills);

// Update skill
router.put("/skills/:id",protect, jobSeekerOnly, updateSkill);

// Delete skill
router.delete("/skills/:id",protect, jobSeekerOnly, deleteSkill);

// ==================== JOB DISCOVERY ROUTES ====================
// Get jobs jobs ()
router.get("/jobs", getJobs);

// Search jobs (with advanced filtering)
router.get("/jobs/search", searchJobs);

// Get recommended jobs based on user skills
router.get("/jobs/recommended",protect, jobSeekerOnly, getRecommendedJobs);

// Get job details by ID
router.get("/jobs/:id", getJobDetails);

// ==================== APPLICATION ROUTES ====================
// Apply to a job
router.post("/jobs/:id/apply",protect, jobSeekerOnly, applyToJob)

export default router;

