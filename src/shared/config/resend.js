// src/config/mail.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simulate a "transporter" object to keep your code consistent
const transporter = {
  async sendMail({ to, subject, html, from }) {
    try {
      const response = await resend.emails.send({
        from: from || "MeetAI <no-reply@resend.dev>",
        to,
        subject,
        html,
      });

      console.log("✅ Email sent successfully:", response.id);
      return response;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  },
};

// Verify connection (optional, just for logging)
(async () => {
  try {
    await resend.emails.send({
      from: "MeetAI <no-reply@resend.dev>",
      to: "verify@resend.dev", // internal check email
      subject: "Resend connection verified",
      html: "<p>Resend email service is working ✅</p>",
    });
    console.log("✅ Resend API is ready to send emails");
  } catch (error) {
    console.error("❌ Resend verification failed:", error.message);
  }
})();

export default transporter;
