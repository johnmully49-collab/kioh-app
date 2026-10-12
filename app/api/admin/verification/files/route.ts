import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/auth";
import {
  getDb,
  type MentorApplicationDocument,
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
    const key = new URL(request.url).searchParams.get("key");
    if (!key) {
      return NextResponse.json({ message: "File key is required." }, { status: 400 });
    }

    const db = await getDb();
    const application = await db
      .collection<MentorApplicationDocument>("mentorApplications")
      .findOne({ status: "Under Review", certificateKeys: key });
    if (!application) {
      return NextResponse.json(
        { message: "This certificate is not attached to a pending mentor application." },
        { status: 404 }
      );
    }

    const upload = await db.collection<UserUploadDocument>("userUploads").findOne({
      _id: key,
      userId: application.userId,
      category: "certificate",
    });
    if (!upload) {
      return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
    }

    const signedUrl = await uploadthing.generateSignedURL(key, {
      expiresIn: "5 minutes",
    });
    return NextResponse.redirect(signedUrl.ufsUrl);
  } catch (error) {
    console.error("[ADMIN_VERIFICATION_FILE_ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to access the certificate." },
      { status: 500 }
    );
  }
}
