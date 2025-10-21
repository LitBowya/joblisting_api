import express from "express";
import {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    forgotPassword,
    resetPassword,
    logoutUser,
} from "../controllers/auth.controller.js";
import { protect } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// Public routes with rate limiting
router.post("/register", registerUser);

router.post("/verify-otp", verifyOtp);

router.post("/resend-otp", resendOtp);

router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

// Protected route
router.post("/logout", protect, logoutUser);

export default router;
