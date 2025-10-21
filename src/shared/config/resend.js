// src/config/mail.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = {
  async sendMail({ to, subject, html, from }) {
    try {
      const { data, error } = await resend.emails.send({
        from: from || "MeetAI <no-reply@resend.dev>",
        to,
        subject,
        html,
      });

      if (error) {
        console.error("❌ Email sending failed:", error);
        throw error;
      }

      console.log("✅ Email sent successfully! ID:", data.id);
      return data;
    } catch (err) {
      console.error("❌ Unexpected email error:", err);
      throw err;
    }
  },
};

// Optional verification at startup
(async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: "MeetAI <no-reply@resend.dev>",
      to: "verify@resend.dev",
      subject: "Resend connection verified",
      html: "<p>Resend email service is working ✅</p>",
    });

    if (error) {
      console.error("❌ Resend verification failed:", error.message);
    } else {
      console.log("✅ Resend API is ready! Test ID:", data.id);
    }
  } catch (error) {
    console.error("❌ Resend verification error:", error.message);
  }
})();

export default transporter;
