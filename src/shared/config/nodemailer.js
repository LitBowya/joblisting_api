import nodemailer from "nodemailer";

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Gmail SMTP connection error:", error);
    } else {
        console.log("✅ Gmail SMTP is ready to send emails");
    }
});

export default transporter;
