import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/server/actions/emailActions";
import {
  getDb,
  type EmailVerificationTokenDocument,
  type UserDocument,
} from "@/server/lib/mongodb";

const genericMessage =
  "If your account is registered and still needs verification, a new link will be sent to your email.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.collection<UserDocument>("users").findOne({ email });
    if (user && !user.emailVerifiedAt && user.passwordHash) {
      const token = randomBytes(32).toString("hex");
      const tokens =
        db.collection<EmailVerificationTokenDocument>("emailVerificationTokens");
      const recentToken = await tokens.findOne({
        userId: user._id,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
      });
      if (recentToken) {
        return NextResponse.json({ success: true, message: genericMessage });
      }
      await tokens.deleteMany({ userId: user._id });
      await tokens.insertOne({
        _id: randomUUID(),
        token,
        userId: user._id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await sendVerificationEmail(user.name, user.email, token);
      if (!result.success) {
        console.error("[RESEND_VERIFICATION_EMAIL_ERROR]:", result.error);
      }
    }

    return NextResponse.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("[RESEND_VERIFICATION_ROUTE_ERROR]:", error);
    return NextResponse.json(
      { message: "Could not process the request right now. Please try again." },
      { status: 500 }
    );
  }
}
