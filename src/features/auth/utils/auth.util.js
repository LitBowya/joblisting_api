import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.config.js";

const hashPassword = async password => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
};

const comparePassword = async (loginPassword, userPassword) => {
    return bcrypt.compare(loginPassword, userPassword);
};

const generateAccessToken = user => {
    return jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        jwtConfig.accessTokenSecret,
        { expiresIn: jwtConfig.accessTokenExpiry }
    );
};

const generateRefreshToken = user => {
    return jwt.sign(
        { id: user.id, email: user.email, userType: user.userType },
        jwtConfig.refreshTokenSecret,
        { expiresIn: jwtConfig.refreshTokenExpiry }
    );
};

const generateOtp = () => {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000);
};

const verifyOTP = async (providedOtp, storedOtp, otpExpiresIn) => {
    if (!storedOtp || !otpExpiresIn) {
        return false;
    }
    const isExpired = new Date() > new Date(otpExpiresIn);
    if (isExpired) {
        return false;
    }
    return providedOtp === storedOtp;
};

export {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    generateOtp,
    verifyOTP,
};
