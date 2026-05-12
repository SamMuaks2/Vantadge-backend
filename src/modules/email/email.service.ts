import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { TimeSlotDocument } from "../bookings/schemas/booking.schema";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get("SMTP_HOST"),
      port: Number(this.configService.get("SMTP_PORT")) || 587,
      secure: false,
      auth: {
        user: this.configService.get("SMTP_USER"),
        pass: this.configService.get("SMTP_PASS"),
      },
    });
  }

  private get from() {
    return `Vantadge Fitness <${this.configService.get("SMTP_FROM") || "hello@vantadgefitness.com"}>`;
  }

  private baseTemplate(content: string) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #f9fafb; font-family: 'DM Sans', -apple-system, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #7B2D8B 0%, #4ECDA4 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin: 0; font-style: italic; }
    .header p { color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0 0; letter-spacing: 0.2em; text-transform: uppercase; }
    .body { background: white; padding: 40px; border-radius: 0 0 16px 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7B2D8B 0%, #4ECDA4 100%); color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 24px 0; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #9ca3af; }
    h2 { color: #1a1a2e; font-size: 22px; margin: 0 0 12px; }
    p { color: #4b5563; line-height: 1.6; font-size: 15px; }
    .highlight { background: #f3f4f6; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .highlight p { margin: 4px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Vantadge</h1>
      <p>Older · Stronger · Healthier</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Vantadge Fitness · London, UK</p>
      <p>hello@vantadgefitness.com</p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendWelcome(email: string, name: string) {
    const content = `
      <h2>Welcome to Vantadge, ${name.split(" ")[0]}! 🎉</h2>
      <p>We're thrilled to have you join our community of people who believe that the best chapters are still ahead.</p>
      <p>Here's what you can do next:</p>
      <ul style="color:#4b5563; line-height:2">
        <li>Browse our <a href="${this.configService.get("FRONTEND_URL")}/programs" style="color:#7B2D8B">fitness programmes</a></li>
        <li><a href="${this.configService.get("FRONTEND_URL")}/bookings" style="color:#7B2D8B">Book a free consultation</a></li>
        <li>Read our <a href="${this.configService.get("FRONTEND_URL")}/blog" style="color:#7B2D8B">health & fitness blog</a></li>
      </ul>
      <a href="${this.configService.get("FRONTEND_URL")}/dashboard" class="btn">Go to My Dashboard →</a>
      <p style="font-size:13px; color:#9ca3af">Older. Stronger. Healthier.</p>
    `;
    await this.send(email, "Welcome to Vantadge Fitness! 💪", content);
  }

  async sendBookingApproved(
    email: string, name: string,
    slot: any, fee: number
  ) {
    const content = `
      <h2>Your Booking is Confirmed, ${name.split(" ")[0]}!</h2>
      <p>Great news — we've approved your consultation request. Here are the details:</p>
      <div class="highlight">
        <p><strong>Session:</strong> ${slot.sessionType}</p>
        <p><strong>Date:</strong> ${new Date(slot.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Time:</strong> ${slot.startTime} — ${slot.endTime}</p>
        <p><strong>Consultation Fee:</strong> £${fee}</p>
      </div>
      <p>Please arrange payment before your session. Contact us if you have any questions.</p>
      <a href="${this.configService.get("FRONTEND_URL")}/dashboard" class="btn">View My Dashboard →</a>
    `;
    await this.send(email, "✅ Booking Approved – Vantadge Fitness", content);
  }

  async sendBookingRejected(email: string, name: string, reason: string) {
    const content = `
      <h2>Booking Update, ${name.split(" ")[0]}</h2>
      <p>Unfortunately, we're unable to confirm your recent booking request at this time.</p>
      <div class="highlight">
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
      <p>We'd love to find a time that works — please check our available slots and try booking again.</p>
      <a href="${this.configService.get("FRONTEND_URL")}/bookings" class="btn">View Available Slots →</a>
    `;
    await this.send(email, "Booking Update – Vantadge Fitness", content);
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const resetUrl = `${this.configService.get("FRONTEND_URL")}/auth/reset-password?token=${token}`;
    const content = `
      <h2>Reset Your Password</h2>
      <p>Hi ${name.split(" ")[0]}, we received a request to reset your Vantadge password.</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="font-size:13px; color:#9ca3af">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
    `;
    await this.send(email, "Password Reset – Vantadge Fitness", content);
  }

  async sendSubscriptionPaymentPending(email: string, name: string, programTitle: string, message: string) {
    const content = `
      <h2>Payment Update for ${programTitle}</h2>
      <p>Hi ${name.split(" ")[0]},</p>
      <div class="highlight"><p>${message}</p></div>
      <a href="${this.configService.get("FRONTEND_URL")}/dashboard/subscription" class="btn">View My Subscription →</a>
    `;
    await this.send(email, `Payment Update – ${programTitle}`, content);
  }

  async sendTrainingSchedule(email: string, name: string, programTitle: string, schedule: string) {
    const content = `
      <h2>Your Training Schedule is Ready! 🏋️</h2>
      <p>Hi ${name.split(" ")[0]}, your personalised training schedule for <strong>${programTitle}</strong> has been prepared.</p>
      <div class="highlight" style="white-space:pre-wrap; font-family: monospace; font-size:13px">${schedule}</div>
      <p>Log in to your dashboard to track your sessions and progress.</p>
      <a href="${this.configService.get("FRONTEND_URL")}/dashboard/schedule" class="btn">View My Schedule →</a>
    `;
    await this.send(email, `Your Training Schedule – ${programTitle}`, content);
  }

  async sendContactReply(email: string, name: string, originalSubject: string, reply: string) {
    const content = `
      <h2>Reply from Vantadge Fitness</h2>
      <p>Hi ${name}, thank you for reaching out. Here's our response to your message about <em>"${originalSubject}"</em>:</p>
      <div class="highlight"><p>${reply}</p></div>
      <p>Feel free to reply to this email if you have further questions.</p>
    `;
    await this.send(email, `Re: ${originalSubject}`, content);
  }

  private async send(to: string, subject: string, htmlContent: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html: this.baseTemplate(htmlContent),
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }
}
