import { db } from "../../../shared/db/index.js";
import { usersTable } from "../../../shared/models/user.model.js";
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    generateOtp,
    verifyOTP,
} from "../utils/auth.util.js";
import {
    sendRegistrationEmail,
    sendForgotPasswordEmail, sendResetPasswordEmail,
} from "../../../shared/services/email.service.js";
import { eq } from "drizzle-orm";
import "dotenv/config";
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resendOtpSchema,
    resetPasswordSchema,
    verifyOtpSchema,
} from "../validations/auth.validation.js";
import {formatZodErrorMessage} from "../../../shared/utils/formatZodErrorMessage.js";

// Controller: Register User Controller
// Method: Post Request
// Route: /register
const registerUser = async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
                            const message = formatZodErrorMessage(result.error);
                            return res.status(400).json({ message });
                        }
        const { name, email, password, userType } = result.data;

        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOtp();
        const otpExpiresIn = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in

        const emailResult = await sendRegistrationEmail( email,name, otp );
        if (!emailResult.success) {
            console.error(
                `Failed to send registration email to ${email}: ${emailResult.error.message}`
            );
            return res.status(500).json({
                message: "Error sending verification email",
                error: emailResult.error.message,
            });
        }

        // 10 minutes
        const [newUser] = await db
            .insert(usersTable)
            .values({
                name,
                email,
                password: hashedPassword,
                userType,
                otp,
                otpExpiresIn,
            })
            .returning();


        res.status(201).json({
            message: "User registered, please verify email with OTP",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                userType: newUser.userType,
            },
        });
    } catch (error) {
        console.error(`Error registering user: ${error.message}`);
        res.status(500).json({
            message: "Error registering user",
            error: error.message,
        });
    }
};

// Controller: Verify OTP Controller
// Method: Post Request
// Route: /verify-otp
const verifyOtp = async (req, res) => {
    try {
        const result = verifyOtpSchema.safeParse(req.body);

        if (!result.success) {
                            const message = formatZodErrorMessage(result.error);
                            return res.status(400).json({ message });
                        }
        const { email, otp } = result.data;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otpVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        const isValidOtp = await verifyOTP(otp, user.otp, user.otpExpiresIn);
        if (!isValidOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        await db
            .update(usersTable)
            .set({ otpVerified: true, otp: null, otpExpiresIn: null })
            .where(eq(usersTable.email, email));
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error(`Error verifying OTP: ${error.message}`);
        res.status(500).json({
            message: "Error verifying OTP",
            error: error.message,
        });
    }
};

// Controller: Resend OTP Controller
// Method: Post Request
// Route: /resend-otp
const resendOtp = async (req, res) => {
    try {
        const result = resendOtpSchema.safeParse(req.body);

        if (!result.success) {
                            const message = formatZodErrorMessage(result.error);
                            return res.status(400).json({ message });
                        }

        const { email } = req.body;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpiresIn = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
        const otpVerified = false;

        // Update user with new OTP
        await db
            .update(usersTable)
            .set({ otp, otpExpiresIn, otpVerified })
            .where(eq(usersTable.email, email));

        // Send registration email with new OTP
        const emailResult = await sendRegistrationEmail(email,user.name, otp );
        if (!emailResult.success) {
            console.error(
                `Failed to resend OTP email to ${email}: ${emailResult.error.message}`
            );
            return res.status(500).json({
                message: "Error sending verification email",
                error: emailResult.error.message,
            });
        }

        res.status(200).json({
            message: "Verification code has been resent to your email",
            email: email,
        });
    } catch (error) {
        console.error(`Error resending OTP: ${error.message}`);
        res.status(500).json({
            message: "Error resending verification code",
            error: error.message,
        });
    }
};

// Controller: Login User Controller
// Method: Post Request
// Route: /login
const loginUser = async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
                    const message = formatZodErrorMessage(result.error);
                    return res.status(400).json({ message });
                }

        const { email, password } = result.data;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.otpVerified) {
            return res.status(403).json({
                message: "Email not verified, please verify your email",
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: "none",
            path: "/",
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: "none"
        });
        res.status(200).json({
            message: "Logged in successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.userType,
            },
        });
    } catch (error) {
        console.error(`Error logging in user: ${error.message}`);
        res.status(500).json({
            message: "Error logging in",
            error: error.message,
        });
    }
};

// Controller: Forgot Password Controller
// Method: Post Request
// Route: /forgot-password
const forgotPassword = async (req, res) => {
    try {
        const result = forgotPasswordSchema.safeParse(req.body);

        if (!result.success) {
                    const message = formatZodErrorMessage(result.error);
                    return res.status(400).json({ message });
                }

        const { email } = result.data;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (!user) {
            return res.status(400).json({ message: `${email} does not exist` });
        }

        if (!user.otpVerified) {
            return res.status(403).json({ message: "Email not verified" });
        }

        const otp = generateOtp();
        const otpExpiresIn = new Date(Date.now() + 10 * 60 * 1000);
        await db
            .update(usersTable)
            .set({ otp, otpExpiresIn })
            .where(eq(usersTable.email, email));

        const emailResult = await sendForgotPasswordEmail(email, user.name, otp );
        if (!emailResult.success) {
          console.error(
            `Failed to send password reset email to ${email}: ${emailResult.error.message}`
          );
          return res
            .status(500)
            .json({
              message: "Error sending reset email",
              error: emailResult.error.message,
            });
        }

        res.status(200).json({
            message: `Otp for password reset sent to ${email});`,
        });
    } catch (error) {
        console.error(`Error during forgot password: ${error.message}`);
        res.status(500).json({
            message: "Error during forgot password",
            error: error.message,
        });
    }
};

// Controller: Reset Password Controller
// Method: Post Request
// Route: /reset-password
const resetPassword = async (req, res) => {
    try {
        const result = resetPasswordSchema.safeParse(req.body);

        if (!result.success) {
                    const message = formatZodErrorMessage(result.error);
                    return res.status(400).json({ message });
                }
        const { email, otp, newPassword } = result.data;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValidOtp = await verifyOTP(otp, user.otp, user.otpExpiresIn);
        if (!isValidOtp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const emailResult = await sendResetPasswordEmail(email, user.name);
        if (!emailResult.success) {
          console.error(
            `Failed to send password reset email to ${email}: ${emailResult.error.message}`
          );
          return res
            .status(500)
            .json({
              message: "Error sending reset email",
              error: emailResult.error.message,
            });
        }

        const hashedPassword = await hashPassword(newPassword);
        await db
            .update(usersTable)
            .set({ password: hashedPassword, otp: null, otpExpiresIn: null })
            .where(eq(usersTable.email, email));

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Password reset successfully, Login again" });
    } catch (error) {
        console.error(`Error resetting password: ${error.message}`);
        res.status(500).json({
            message: "Error resetting password",
            error: error.message,
        });
    }
};


// Controller: Logout User Controller
// Method: Post Request
// Route: /logout
const logoutUser = async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(`Error logging out user: ${error.message}`);
        res.status(500).json({
            message: "Error logging out",
            error: error.message,
        });
    }
};

export {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    forgotPassword,
    resetPassword,
    logoutUser,
};
