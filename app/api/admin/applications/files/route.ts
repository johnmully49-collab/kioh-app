import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/auth";
import {
  getDb,
  type ApplicationDocument,
  type UserUploadDocument,
} from "@/server/lib/mongodb";

const uploadthing = new UTApi();

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { message: "Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const applicationId = searchParams.get("applicationId");
    const key = searchParams.get("key");
    if (!applicationId || !key) {
      return NextResponse.json(
        { message: "Application and file identifiers are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const application = await db
      .collection<ApplicationDocument>("applications")
      .findOne({
        _id: applicationId,
        status: { $in: ["Under Review", "Shortlisted"] },
        $or: [{ pitchDeckKey: key }, { certificateKeys: key }],
      });
    if (!application) {
      return NextResponse.json(
        { message: "This file is not attached to an active application review." },
        { status: 404 }
      );
    }

    const expectedCategory =
      application.pitchDeckKey === key ? "pitchDeck" : "certificate";
    const upload = await db
      .collection<UserUploadDocument>("userUploads")
      .findOne({
        _id: key,
        userId: application.userId,
        category: expectedCategory,
      });
    if (!upload) {
      return NextResponse.json(
        { message: "Application file not found." },
        { status: 404 }
      );
    }

    const signedUrl = await uploadthing.generateSignedURL(key, {
      expiresIn: "5 minutes",
    });
    return NextResponse.redirect(signedUrl.ufsUrl);
  } catch (error) {
    console.error("[ADMIN_APPLICATION_FILE_ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to access the application file." },
      { status: 500 }
    );
  }
}
