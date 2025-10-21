import { db } from "../../../shared/db/index.js";
import { usersTable } from "../../../shared/models/user.model.js";
import { eq } from "drizzle-orm";
import {
    getUserById,
    isEmailTaken,
    getUserByIdWithPassword,
} from "../utils/user.util.js";
import { hashPassword, comparePassword } from "../../auth/utils/auth.util.js";
import {
    changePasswordSchema,
    updateUserProfileSchema,
} from "../validations/user.validation.js";

// Controller: Get User Profile
// Method: GET Request
// Route: /profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile retrieved successfully",
            user,
        });
    } catch (error) {
        console.error(`Error retrieving user profile: ${error.message}`);
        res.status(500).json({
            message: "Error retrieving profile",
            error: error.message,
        });
    }
};

// Controller: Update User Profile
// Method: PUT Request
// Route: /profile
const updateUserProfile = async (req, res) => {
    try {
        const result = updateUserProfileSchema.safeParse(req.body);

        if (!result.success) {
            console.error(
                `Invalid input for profile update: ${result.error.issues}`
            );
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.issues,
            });
        }

        const userId = req.user.id;
        const { name, email } = result.data;
        const updateData = {};

        // Check if there's anything to update
        if (!name && !email) {
            return res
                .status(400)
                .json({ message: "No fields provided for update" });
        }

        if (name) {
            updateData.name = name;
        }

        if (email) {
            // Check if email is already taken by another user
            const emailTaken = await isEmailTaken(email, userId);
            if (emailTaken) {
                return res
                    .status(400)
                    .json({ message: "Email is already in use" });
            }
            updateData.email = email;
            // If email is changed, mark as unverified for security
            updateData.otpVerified = false;
        }

        const [updatedUser] = await db
            .update(usersTable)
            .set(updateData)
            .where(eq(usersTable.id, userId))
            .returning({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                userType: usersTable.userType,
                otpVerified: usersTable.otpVerified,
                updatedAt: usersTable.updatedAt,
            });

        res.status(200).json({
            message: email
                ? "Profile updated. Please verify your new email address."
                : "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error(`Error updating user profile: ${error.message}`);
        res.status(500).json({
            message: "Error updating profile",
            error: error.message,
        });
    }
};

// Controller: Change Password
// Method: PUT Request
// Route: /change-password
const changePassword = async (req, res) => {
    try {
        const result = changePasswordSchema.safeParse(req.body);
        if (!result.success) {
            console.error(
                "Invalid input for password change",
                result.error.issues
            );
            return res.status(400).json({
                message: "Invalid input",
                errors: result.error.issues,
            });
        }

        const userId = req.user.id;
        const { currentPassword, newPassword } = result.data;
        const user = await getUserByIdWithPassword(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isCurrentPasswordValid = await comparePassword(
            currentPassword,
            user.password
        );
        if (!isCurrentPasswordValid) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        if (await comparePassword(newPassword, user.password)) {
            return res.status(400).json({
                message:
                    "New password cannot be the same as the current password",
            });
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await db
            .update(usersTable)
            .set({ password: hashedNewPassword })
            .where(eq(usersTable.id, userId));

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res
            .status(200)
            .json({ message: "Password changed successfully, Login again" });
    } catch (error) {
        console.error(`Error in changing password: ${error.message}`);
        return res.status(500).json({
            message: "Error in changing password",
            error: error.message,
        });
    }
};


export {
    getUserProfile,
    updateUserProfile,
    changePassword,
};
