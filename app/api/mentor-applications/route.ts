import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendMentorApplicationEmail } from "@/server/actions/emailActions";
import {
  getDb,
  type MentorApplicationDocument,
  type UserDocument,
  type UserUploadDocument,
} from "@/server/lib/mongodb";
import { KENYA_COUNTIES } from "@/server/data/opportunities";

const SPECIALTIES = [
  "AgriTech",
  "FinTech & Web3",
  "Software Architecture",
  "Grant Writing & Funding",
  "Venture Capital & Pitch Decks",
  "CleanTech & Energy",
  "Community Growth & Policy",
  "Product Strategy",
];
const AVAILABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to view your mentor application." },
      { status: 401 }
    );
  }

  try {
    const db = await getDb();
    const application = await db
      .collection<MentorApplicationDocument>("mentorApplications")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(1)
      .project<{
        status: MentorApplicationDocument["status"];
        createdAt: Date;
        reviewedAt?: Date;
      }>({
        status: 1,
        createdAt: 1,
        reviewedAt: 1,
        _id: 0,
      })
      .next();

    return NextResponse.json({
      success: true,
      data: application
        ? {
            status: application.status,
            submittedAt: application.createdAt.toISOString().slice(0, 10),
            statusUpdatedAt: (
              application.reviewedAt ?? application.createdAt
            ).toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[MENTOR_APPLICATION_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load your mentor application." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in with a verified account to submit your application." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const organization =
      typeof body.organization === "string" ? body.organization.trim() : "";
    const county = typeof body.county === "string" ? body.county : "";
    const experienceYears = Number(body.experienceYears);
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const linkedinUrl =
      typeof body.linkedinUrl === "string" ? body.linkedinUrl.trim() : "";
    const specialties: string[] = Array.isArray(body.specialties)
      ? body.specialties.filter(
          (value: unknown): value is string => typeof value === "string"
        )
      : [];
    const availableDays: string[] = Array.isArray(body.availableDays)
      ? body.availableDays.filter(
          (value: unknown): value is string => typeof value === "string"
        )
      : [];
    const certificateKeys = Array.isArray(body.certificateKeys)
      ? body.certificateKeys.filter(
          (value: unknown): value is string => typeof value === "string"
        )
      : [];

    const invalidFields: string[] = [];
    if (fullName.length < 2 || fullName.length > 120) invalidFields.push("full name");
    if (title.length < 2 || title.length > 120) invalidFields.push("professional title");
    if (organization.length < 2 || organization.length > 160) {
      invalidFields.push("organization");
    }
    if (
      !KENYA_COUNTIES.includes(county) ||
      county === "All Counties" ||
      county === "Nationwide"
    ) {
      invalidFields.push("county");
    }
    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 1 ||
      experienceYears > 25
    ) {
      invalidFields.push("years of experience");
    }
    if (bio.length < 20 || bio.length > 3000) invalidFields.push("bio");
    if (!/^https:\/\/.+/i.test(linkedinUrl) || linkedinUrl.length > 500) {
      invalidFields.push("LinkedIn or website profile URL");
    }
    if (
      specialties.length === 0 ||
      specialties.some((specialty) => !SPECIALTIES.includes(specialty)) ||
      new Set(specialties).size !== specialties.length ||
      (body.specialties != null &&
        (!Array.isArray(body.specialties) ||
          body.specialties.some(
            (value: unknown) => typeof value !== "string"
          )))
    ) {
      invalidFields.push("mentorship domains");
    }
    if (
      availableDays.length === 0 ||
      availableDays.some((day) => !AVAILABLE_DAYS.includes(day)) ||
      new Set(availableDays).size !== availableDays.length ||
      (body.availableDays != null &&
        (!Array.isArray(body.availableDays) ||
          body.availableDays.some(
            (value: unknown) => typeof value !== "string"
          )))
    ) {
      invalidFields.push("availability days");
    }
    if (
      certificateKeys.length > 3 ||
      (body.certificateKeys != null &&
        (!Array.isArray(body.certificateKeys) ||
          body.certificateKeys.some(
            (value: unknown) => typeof value !== "string"
          ))) ||
      new Set(certificateKeys).size !== certificateKeys.length
    ) {
      invalidFields.push("certificate uploads");
    }

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          message: `Please check the following: ${invalidFields.join(", ")}.`,
          invalidFields,
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.collection<UserDocument>("users").findOne({
      _id: session.user.id,
    });
    if (!user) {
      return NextResponse.json(
        { message: "Your account could not be found. Please sign in again." },
        { status: 401 }
      );
    }

    const existingApplication = await db
      .collection<MentorApplicationDocument>("mentorApplications")
      .findOne({
        userId: user._id,
        status: { $in: ["Under Review", "Approved"] },
      });
    if (existingApplication) {
      return NextResponse.json(
        {
          message:
            existingApplication.status === "Approved"
              ? "Your Navigator application has already been approved."
              : "You already have a Navigator application under review.",
        },
        { status: 409 }
      );
    }

    const certificates = certificateKeys.length
      ? await db
          .collection<UserUploadDocument>("userUploads")
          .find({
            _id: { $in: certificateKeys },
            userId: user._id,
            category: "certificate",
          })
          .toArray()
      : [];
    if (certificates.length !== certificateKeys.length) {
      return NextResponse.json(
        { message: "One or more certificate uploads are invalid." },
        { status: 400 }
      );
    }

    const application: MentorApplicationDocument = {
      _id: randomUUID(),
      userId: user._id,
      fullName,
      email: user.email,
      title,
      organization,
      county,
      experienceYears,
      specialties,
      bio,
      linkedinUrl,
      availableDays,
      certificateKeys,
      publicProfileConsent: body.publicProfileConsent === true,
      status: "Under Review",
      createdAt: new Date(),
    };
    await db
      .collection<MentorApplicationDocument>("mentorApplications")
      .insertOne(application);

    const emailResult = await sendMentorApplicationEmail(
      fullName,
      user.email,
      specialties,
      county
    );
    if (!emailResult.success) {
      console.error("[MENTOR_APPLICATION_EMAIL_WARNING]:", emailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: emailResult.success,
        message: "Your mentor application has been received.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MENTOR_APPLICATION_CREATE_ERROR]:", error);
    return NextResponse.json(
      { message: "Failed to submit your application. Please try again." },
      { status: 500 }
    );
  }
}
