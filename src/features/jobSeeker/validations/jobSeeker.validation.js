import { z } from "zod";

// Job Seeker Profile Validation
export const createProfileSchema = z.object({
    phone: z.string().max(20).optional(),
    location: z.string().max(255).optional(),
    bio: z.string().optional(),
    yearsOfExperience: z.number().int().min(0).max(100).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

// Skills Validation
export const addSkillSchema = z.object({
    skillName: z.string().min(1, "Skill name is required").max(100),
    proficiencyLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
});

export const updateSkillSchema = addSkillSchema.partial();
