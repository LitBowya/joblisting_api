import { z } from "zod";

// Company Profile Validation
export const createCompanySchema = z.object({
    companyName: z.string().min(1, "Company name is required").max(255),
    companyEmail: z.string().email("Invalid email").max(255).optional(),
    companyPhone: z.string().max(20).optional(),
    website: z.string().url("Invalid website URL").max(255).optional(),
    industry: z.string().max(100).optional(),
    location: z.string().max(255).optional(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
    companyName: z.string().min(1, "Company name is required").max(255).optional(),
});

// Job Listing Validation
export const createJobSchema = z.object({
    companyId: z.number().int().positive("Company ID is required"),
    title: z.string().min(1, "Job title is required").max(255),
    description: z.string().min(10, "Description must be at least 10 characters"),
    jobType: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]),
    locationType: z.enum(["on_site", "remote", "hybrid"]),
    location: z.string().max(255).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
    status: z.enum(["open", "closed", "draft"]).default("open").optional(),
});

export const updateJobSchema = createJobSchema.partial();

// Job Skills Validation
export const addJobSkillSchema = z.object({
    skillName: z.string().min(1, "Skill name is required").max(100),
    isRequired: z.boolean().default(true).optional(),
});

// Job Application Validation
export const createApplicationSchema = z.object({
    // Job seeker simply applies - no additional data needed
});

export const updateApplicationStatusSchema = z.object({
    status: z.enum(["pending", "reviewed", "shortlisted", "rejected", "accepted"]),
});
