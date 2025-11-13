/**
 * Email Utilities
 *
 * Sends authentication emails using Nodemailer
 * - Email verification
 * - Password reset
 * - Welcome emails
 */

import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 * @param options - Email options
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@nexusfinance.app",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Send email verification link
 * @param email - User's email
 * @param name - User's name
 * @param token - Verification token
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Nexus Finance!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for signing up! Please verify your email address to activate your account.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 Nexus Finance Analyst. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${name},
    
    Thank you for signing up! Please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: "Verify your email - Nexus Finance",
    html,
    text,
  });
}

/**
 * Send password reset link
 * @param email - User's email
 * @param name - User's name
 * @param token - Reset token
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.</p>
          </div>
        </div>
        <div class="footer">
          <p>© 2025 Nexus Finance Analyst. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${name},
    
    We received a request to reset your password. Click the link below to create a new password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: "Reset your password - Nexus Finance",
    html,
    text,
  });
}

/**
 * Send welcome email after email verification
 * @param email - User's email
 * @param name - User's name
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { padding: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Nexus Finance!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your email has been verified! You're all set to start managing your finances like a pro.</p>
          <div class="features">
            <h3>What you can do:</h3>
            <div class="feature">💰 Track stocks, crypto, and cash accounts</div>
            <div class="feature">📊 View real-time analytics and insights</div>
            <div class="feature">🎯 Set and track financial goals</div>
            <div class="feature">📱 Import Mpesa transactions automatically</div>
          </div>
          <p style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
          </p>
          <p>Need help? Check out our documentation or reach out to support.</p>
        </div>
        <div class="footer">
          <p>© 2025 Nexus Finance Analyst. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${name},
    
    Your email has been verified! You're all set to start managing your finances.
    
    Visit your dashboard: ${dashboardUrl}
    
    What you can do:
    - Track stocks, crypto, and cash accounts
    - View real-time analytics and insights
    - Set and track financial goals
    - Import Mpesa transactions automatically
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Nexus Finance! 🎉",
    html,
    text,
  });
}

