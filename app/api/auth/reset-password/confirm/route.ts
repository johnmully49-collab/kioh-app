import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getDb,
  type PasswordResetTokenDocument,
  type UserDocument,
} from "@/server/lib/mongodb";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!/^[a-f\d]{64}$/i.test(token) || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Token, email, and password are required." },
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
    const user = await users.findOne({ email });
    const resetRecord = user
      ? await db.collection<PasswordResetTokenDocument>("passwordResetTokens").findOne({
          userId: user._id,
          expiresAt: { $gt: new Date() },
          $or: [
            {
              token: createHash("sha256")
                .update(token.toLowerCase())
                .digest("hex"),
            },
            { token },
          ],
        })
      : null;
    if (!user || !resetRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await users.updateOne(
      { _id: user._id },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    await db
      .collection<PasswordResetTokenDocument>("passwordResetTokens")
      .deleteMany({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD_CONFIRM_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
