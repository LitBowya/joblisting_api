import transporter from "../config/nodemailer.js";
import { emailTemplate } from "../utils/emailTemplate.js";

/**
 * Send forgot password email with OTP
 */
export const sendRegistrationEmail = async (to, name, otp) => {
    const title = "Welcome! Verify Your Email";
    const message = `
        Hi ${name},<br><br>
        Thank you for registering with MeetAI! To complete your registration and verify your email address, please use the OTP code below:<br><br>
        <div style="text-align: center; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
            ${otp}
        </div>
        <br>
        This code will expire in 10 minutes. If you didn't create an account, please ignore this email.
    `;

    const mailOptions = {
        from: `"MeetAI" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Verify Your Email - MeetAI",
        html: emailTemplate({ title, message}),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        throw new Error("Failed to send registration email");
    }
};

/**
 * Send forgot password email with OTP
 */
export const sendForgotPasswordEmail = async (to, name, otp) => {
    const title = "Reset Your Password";
    const message = `
        Hi ${name},<br><br>
        We received a request to reset your password. Please use the OTP code below to proceed with resetting your password:<br><br>
        <div style="text-align: center; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
            ${otp}
        </div>
        <br>
        This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    `;

    const mailOptions = {
        from: `"MeetAI" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Reset Your Password - MeetAI",
        html: emailTemplate({ title, message, }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending forgot password email:", error);
        throw new Error("Failed to send forgot password email");
    }
};

/**
 * Send password reset confirmation email
 */
export const sendResetPasswordEmail = async (to, name) => {
    const title = "Password Reset Successful";
    const message = `
        Hi ${name},<br><br>
        Your password has been successfully reset. You can now log in to your account using your new password.<br><br>
        If you didn't make this change or if you believe an unauthorized person has accessed your account, please contact our support team immediately.
    `;


    const mailOptions = {
        from: `"MeetAI" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Password Reset Successful - MeetAI",
        html: emailTemplate({ title, message}),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending reset password email:", error);
        throw new Error("Failed to send reset password email");
    }
};

/**
 * Send application status update email to job seeker
 */
export const sendApplicationStatusUpdateEmail = async (to, jobSeekerName, jobTitle, companyName, status) => {
    const statusMessages = {
        pending: {
            title: "Application Received",
            message: `
                Hi ${jobSeekerName},<br><br>
                Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received and is currently under review.<br><br>
                We will notify you of any updates regarding your application status.
            `
        },
        reviewed: {
            title: "Application Under Review",
            message: `
                Hi ${jobSeekerName},<br><br>
                Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is currently being reviewed by our team.<br><br>
                We appreciate your patience and will keep you updated on the progress.
            `
        },
        shortlisted: {
            title: "Congratulations! You've Been Shortlisted",
            message: `
                Hi ${jobSeekerName},<br><br>
                Great news! Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been shortlisted.<br><br>
                Our team will contact you soon with the next steps in the hiring process.<br><br>
                Congratulations and best of luck!
            `
        },
        rejected: {
            title: "Application Status Update",
            message: `
                Hi ${jobSeekerName},<br><br>
                Thank you for your interest in the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.<br><br>
                After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.<br><br>
                We appreciate the time you invested in the application process and encourage you to apply for future opportunities that match your skills and experience.
            `
        },
        accepted: {
            title: "Congratulations! Your Application Has Been Accepted",
            message: `
                Hi ${jobSeekerName},<br><br>
                Congratulations! We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been accepted.<br><br>
                Our HR team will contact you shortly with further details regarding the onboarding process and next steps.<br><br>
                Welcome aboard!
            `
        }
    };

    const { title, message } = statusMessages[status] || statusMessages.pending;

    const mailOptions = {
        from: `"MeetAI" <${process.env.GMAIL_USER}>`,
        to,
        subject: `${title} - ${companyName}`,
        html: emailTemplate({ title, message }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending application status update email:", error);
        throw new Error("Failed to send application status update email");
    }
};
