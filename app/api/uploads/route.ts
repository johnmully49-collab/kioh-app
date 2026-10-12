import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/auth";
import { getDb, type UserUploadDocument } from "@/server/lib/mongodb";

const uploadthing = new UTApi();

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to access uploaded files." },
      { status: 401 }
    );
  }

  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) {
      return NextResponse.json({ message: "File key is required." }, { status: 400 });
    }

    const db = await getDb();
    const upload = await db.collection<UserUploadDocument>("userUploads").findOne({
      _id: key,
      userId: session.user.id,
    });
    if (!upload) {
      return NextResponse.json({ message: "Uploaded file not found." }, { status: 404 });
    }

    const signedUrl = await uploadthing.generateSignedURL(key, {
      expiresIn: "5 minutes",
    });
    return NextResponse.redirect(signedUrl.ufsUrl);
  } catch (error) {
    console.error("[UPLOAD_ACCESS_ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to access uploaded file." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to remove uploaded files." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const key = typeof body.key === "string" ? body.key : "";
    if (!key) {
      return NextResponse.json({ message: "File key is required." }, { status: 400 });
    }

    const db = await getDb();
    const uploads = db.collection<UserUploadDocument>("userUploads");
    const upload = await uploads.findOne({
      _id: key,
      userId: session.user.id,
    });
    if (!upload) {
      return NextResponse.json({ message: "Uploaded file not found." }, { status: 404 });
    }

    const isAttachedToApplication =
      (await db.collection("applications").findOne({
        userId: session.user.id,
        $or: [{ pitchDeckKey: key }, { certificateKeys: key }],
      })) !== null;
    const isAttachedToMentorApplication =
      (await db.collection("mentorApplications").findOne({
        userId: session.user.id,
        certificateKeys: key,
      })) !== null;
    if (isAttachedToApplication || isAttachedToMentorApplication) {
      return NextResponse.json(
        { message: "This file is attached to a submitted application and cannot be removed." },
        { status: 409 }
      );
    }

    const deletion = await uploadthing.deleteFiles(key);
    if (!deletion.success || deletion.deletedCount !== 1) {
      throw new Error(`UploadThing did not delete file ${key}.`);
    }
    await uploads.deleteOne({ _id: key, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPLOAD_DELETE_ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to remove uploaded file." },
      { status: 500 }
    );
  }
}
