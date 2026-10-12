import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/server/actions/emailActions";
import {
  getDb,
  type EmailVerificationTokenDocument,
  type UserDocument,
} from "@/server/lib/mongodb";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const token = requestUrl.searchParams.get("token");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      new URL("/?error=invalid_verification_link", baseUrl)
    );
  }

  try {
    const db = await getDb();
    const tokenRecord = await db
      .collection<EmailVerificationTokenDocument>(
        "emailVerificationTokens"
      )
      .findOne({ token, expiresAt: { $gt: new Date() } });

    if (!tokenRecord) {
      return NextResponse.redirect(
        new URL("/?error=token_expired_or_invalid", baseUrl)
      );
    }

    const result = await db.collection<UserDocument>("users").updateOne(
      { _id: tokenRecord.userId },
      { $set: { emailVerifiedAt: new Date(), updatedAt: new Date() } }
    );
    if (result.matchedCount !== 1) {
      throw new Error("Verification token references a missing user.");
    }

    await db
      .collection<EmailVerificationTokenDocument>("emailVerificationTokens")
      .deleteOne({ _id: tokenRecord._id });

    const user = await db
      .collection<UserDocument>("users")
      .findOne({ _id: tokenRecord.userId });
    if (user) {
      const welcomeResult = await sendWelcomeEmail(
        user.name,
        user.email,
        user.role
      );
      if (!welcomeResult.success) {
        console.error("[VERIFY_EMAIL_ROUTE] Welcome email could not be sent:", welcomeResult.error);
      }
    }

    return NextResponse.redirect(
      new URL("/?verified=true", baseUrl)
    );
  } catch (error) {
    console.error("[VERIFY_EMAIL_ROUTE_ERROR]:", error);
    return NextResponse.redirect(
      new URL("/?error=verification_failed", baseUrl)
    );
  }
}
