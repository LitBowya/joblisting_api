// Primary JWT auth middleware
import jwt from "jsonwebtoken";
import { jwtConfig } from "../../features/auth/config/jwt.config.js";

export const protect = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // No tokens at all
    if (!accessToken && !refreshToken) {
        return res.status(401).json({ message: "You are not authenticated" });
    }

    // Helper: issue access token
    const issueAccessToken = payload =>
        jwt.sign(
            { id: payload.id, email: payload.email, userType: payload.userType },
            jwtConfig.accessTokenSecret,
            { expiresIn: jwtConfig.accessTokenExpiry }
        );

    // Try verifying access token if present
    if (accessToken) {
        try {
            const decoded = jwt.verify(
                accessToken,
                jwtConfig.accessTokenSecret
            );
            req.user = decoded;
            return next();
        } catch (err) {
            // If token expired we'll try refresh below (if refresh exists)
            console.error("⚠️ Access token verify error:", err.name, err.message);
            // fall through to refresh logic
        }
    }

    // At this point: either access token missing or invalid/expired
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token available" });
    }

    // Try to verify refresh token
    try {
        const decodedRefresh = jwt.verify(
            refreshToken,
            jwtConfig.refreshTokenSecret
        );

        // Issue a new access token
        const newAccessToken = issueAccessToken(decodedRefresh);

        // Set cookie (same options as when issuing originally)
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: "/",
        });

        // attach user to request (use refresh payload or subset)
        req.user = {
            id: decodedRefresh.id,
            email: decodedRefresh.email,
            userType: decodedRefresh.userType,
        };

        return next();
    } catch (refreshErr) {
        console.error(
            "❌ Refresh token verify failed:",
            refreshErr.name,
            refreshErr.message
        );
        // refresh token invalid / expired
        return res
            .status(403)
            .json({ message: "Invalid or expired refresh token" });
    }
};

// Backwards-compatible admin-only middleware
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.userType !== "admin") {
        return res
            .status(403)
            .json({ message: "Access denied. Admin privileges required." });
    }
    next();
};

// Recruiter-only middleware
export const recruiterOnly = (req, res, next) => {

    if (!req.user || req.user.userType !== "recruiter") {

        return res
            .status(403)
            .json({ message: "Access denied. Recruiter privileges required." });
    }
    next();
};

// Job Seeker-only middleware
export const jobSeekerOnly = (req, res, next) => {
    if (!req.user || req.user.userType !== "job_seeker") {
        return res
            .status(403)
            .json({ message: "Access denied. Job seeker privileges required." });
    }
    next();
};
