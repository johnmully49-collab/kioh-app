import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/server/actions/emailActions";
import {
  getDb,
  type EmailVerificationTokenDocument,
  type UserDocument,
} from "@/server/lib/mongodb";
import type { UserRole } from "@/server/types";

const SALT_ROUNDS = 10;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role: UserRole =
      body.role === "navigator" ? "navigator" : "participant";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Full name, email, and password are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection<UserDocument>("users");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = randomUUID();
    const verificationToken = randomBytes(32).toString("hex");
    const now = new Date();

    try {
      await users.insertOne({
        _id: userId,
        name: fullName,
        email,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        passwordHash,
        emailVerifiedAt: null,
        role,
        location: null,
        organization: null,
        bio: null,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists." },
          { status: 409 }
        );
      }
      throw error;
    }

    await db.collection<EmailVerificationTokenDocument>("emailVerificationTokens").insertOne({
      _id: randomUUID(),
      token: verificationToken,
      userId,
      expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
      createdAt: now,
    });

    const emailResult = await sendVerificationEmail(
      fullName,
      email,
      verificationToken
    );
    if (!emailResult.success) {
      console.error(
        "[REGISTER_EMAIL_WARNING] Verification email could not be sent:",
        emailResult.error
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: emailResult.success
          ? "Registration successful. Please check your email to verify your account."
          : "Your account was created, but the verification email could not be sent. Please contact support.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ROUTE_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Unable to complete registration right now." },
      { status: 500 }
    );
  }
}
