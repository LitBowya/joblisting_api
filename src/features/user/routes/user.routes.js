import express from "express";
import {
    protect,
    adminOnly,
} from "../../../shared/middlewares/auth.middleware.js";
import {
    getUserProfile,
    updateUserProfile,
    changePassword,
} from "../controllers/user.controller.js";

const router = express.Router();

// USER ROUTES (Protected - requires authentication)
router.use(protect);

// Get current user profile
router.get("/profile", getUserProfile);

// Update current user profile
router.put("/profile", updateUserProfile);

// Change password
router.put("/change-password", changePassword);



export default router;
