import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .max(255, "Name must be at most 255 characters")
        .trim(),
    email: z
        .email("Invalid email address")
        .min(3, "Email must be at least 3 characters")
        .max(255, "Email must be at most 255 characters")
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(255, "Password must be at most 255 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
    userType: z.enum(["job_seeker", "recruiter"], {
        errorMap: () => ({ message: "User type must be either 'job_seeker' or 'recruiter'" }),
    }),
});

export const loginSchema = z.object({
    email: z
        .email("Invalid email address")
        .min(3, "Email must be at least 3 characters")
        .max(255, "Email must be at most 255 characters")
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(255, "Password must be at most 255 characters"),
});

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string()
    .length(6, "OTP should be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

export const resendOtpSchema = z.object({
    email: z.email("Invalid email address").toLowerCase().trim(),
});

export const forgotPasswordSchema = z.object({
    email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    email: z.email("Invalid email address"),
   otp: z.string()
    .length(6, "OTP should be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(255, "Password must be at most 255 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
});
