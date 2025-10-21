import { z } from "zod";

// Update user profile validations schema
export const updateUserProfileSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(255, "Name must not exceed 255 characters")
        .optional(),
    email: z
        .email("Invalid email format")
        .max(255, "Email must not exceed 255 characters")
        .optional(),
});

// Change password validations schema
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
});
