"use server";

import { createHash, randomBytes } from "node:crypto";
import { createElement } from "react";
import { resend } from "@/server/lib/resend";
import {
  getDb,
  type PasswordResetTokenDocument,
  type UserDocument,
} from "@/server/lib/mongodb";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";
import { ApplicationConfirmationEmail } from "@/components/emails/ApplicationConfirmationEmail";
import { MentorApplicationDecisionEmail } from "@/components/emails/MentorApplicationDecisionEmail";

// Default sender address. Replace with your verified custom domain in production (e.g., "KIOH Team <no-reply@kioh.org>")
const SENDER_EMAIL = "KIOH Team <onboarding@resend.dev>";

/**
 * Sends an email verification link to newly registered users.
 */
export async function sendVerificationEmail(
  fullName: string,
  email: string,
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(
    email
  )}`;

  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Verify your email address - KIOH Ecosystem",
      react: createElement(VerificationEmail, { fullName, verificationUrl }),
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send verification email.";
    console.error("[EMAIL_ACTION] Verification Email Error:", error);
    return { success: false, error: message };
  }
}
import { MentorApplicationConfirmationEmail } from "@/components/emails/MentorApplicationConfirmationEmail";

/**
 * Sends confirmation email when an innovator applies as a Mentor/Navigator.
 */
export async function sendMentorApplicationEmail(
  fullName: string,
  email: string,
  specialties: string[],
  county: string
) {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Navigator Application Received - Kenya Innovation & Opportunity Hub",
      react: createElement(MentorApplicationConfirmationEmail, {
        fullName,
        specialties,
        county,
      }),
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send mentor application confirmation.";
    console.error("[EMAIL_ACTION] Mentor Application Email Error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

export async function sendMentorApplicationDecisionEmail(
  fullName: string,
  email: string,
  status: "Approved" | "Rejected"
) {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: `Navigator Application ${status} - Kenya Innovation & Opportunity Hub`,
      react: createElement(MentorApplicationDecisionEmail, {
        fullName,
        status,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      }),
    });

    if (data.error) {
      console.error(
        "[EMAIL_ACTION] Mentor Application Decision Email Error:",
        data.error
      );
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send mentor application decision.";
    console.error("[EMAIL_ACTION] Mentor Application Decision Email Error:", error);
    return { success: false, error: message };
  }
}

/**
 * Sends a welcome email upon successful email verification.
 */
export async function sendWelcomeEmail(
  fullName: string,
  email: string,
  role: string
) {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: "Welcome to Kenya Innovation & Opportunity Hub! 🚀",
      react: createElement(WelcomeEmail, { fullName, role }),
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send welcome email.";
    console.error("[EMAIL_ACTION] Welcome Email Error:", error);
    return { success: false, error: message };
  }
}

/**
 * Sends a password reset link to users requesting password recovery.
 */
export async function sendPasswordResetLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, message: "Please provide a valid email address." };
  }

  const genericMessage =
    "If an account exists for that email, password reset instructions have been sent.";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetToken = randomBytes(32).toString("hex");

  try {
    const db = await getDb();
    const user = await db
      .collection<UserDocument>("users")
      .findOne({ email: normalizedEmail });
    if (!user?.passwordHash) {
      return { success: true, message: genericMessage };
    }

    await db.collection<PasswordResetTokenDocument>("passwordResetTokens").insertOne({
      _id: randomBytes(16).toString("hex"),
      token: createHash("sha256").update(resetToken).digest("hex"),
      userId: user._id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      normalizedEmail
    )}`;
    const safeEmail = normalizedEmail.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

    const data = await resend.emails.send({
      from: "KIOH Security <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Reset your KIOH account password",
      html: `
        <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0f172a; padding: 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: inline-block; padding: 6px 14px; background-color: rgba(45,212,191,0.1); color: #2dd4bf; border-radius: 9999px; font-size: 11px; font-weight: bold;">
              SECURITY ALERT
            </div>
            <h2 style="color: #ffffff; font-size: 20px; font-weight: bold; margin-top: 16px;">Password Reset Request</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              We received a request to reset the password for your account linked to <strong style="color: #2dd4bf;">${safeEmail}</strong>.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #2dd4bf; color: #020617; font-weight: bold; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 13px; display: inline-block;">
                Reset Password →
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
            </p>
          </div>
        </div>
      `,
    });

    return { success: true, message: genericMessage, data };
  } catch (error: unknown) {
    console.error("[EMAIL_ACTION] Reset Password Email Error:", error);
    return {
      success: false,
      message: "Failed to send reset email.",
    };
  }
}

/**
 * Sends a confirmation email when a user submits an application for an opportunity.
 */
export async function sendApplicationConfirmationEmail(
  fullName: string,
  email: string,
  opportunityTitle: string,
  organization: string,
  county: string,
  grantAmountLabel: string
) {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [email],
      subject: `Application Submitted: ${opportunityTitle} - KIOH`,
      react: createElement(ApplicationConfirmationEmail, {
        fullName,
        opportunityTitle,
        organization,
        county,
        grantAmountLabel,
      }),
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send application confirmation email.";
    console.error("[EMAIL_ACTION] Application Confirmation Error:", error);
    return {
      success: false,
      error: message,
    };
  }
}