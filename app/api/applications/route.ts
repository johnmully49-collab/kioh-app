import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getDb,
  type ApplicationDocument,
  type OpportunityDocument,
  type UserDocument,
  type UserUploadDocument,
} from "@/server/lib/mongodb";
import type { Opportunity } from "@/server/types/opportunity";
import { sendApplicationConfirmationEmail } from "@/server/actions/emailActions";

function toOpportunity(record: OpportunityDocument): Opportunity {
  return {
    id: record._id,
    title: record.title,
    organization: record.organization,
    category: record.category,
    county: record.county,
    grantAmount: record.grantAmount,
    grantAmountLabel: record.grantAmountLabel,
    deadline: record.deadline,
    description: record.description,
    eligibility: record.eligibility,
    tags: record.tags,
    featured: record.featured,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Sign in to view your applications." },
      { status: 401 }
    );
  }

  try {
    const db = await getDb();
    const records = await db
      .collection<ApplicationDocument>("applications")
      .find({ userId: session.user.id })
      .sort({ appliedAt: -1 })
      .toArray();
    const opportunities = db.collection<OpportunityDocument>("opportunities");
    const uploads = db.collection<UserUploadDocument>("userUploads");
    const applications = await Promise.all(
      records.map(async (record) => {
        const opportunityRecord = await opportunities.findOne({
          _id: record.opportunityId,
        });
        if (!opportunityRecord) return null;

        const fileKeys = [
          ...(record.pitchDeckKey ? [record.pitchDeckKey] : []),
          ...(record.certificateKeys ?? []),
        ];
        const documents = await uploads
          .find({ _id: { $in: fileKeys }, userId: session.user.id })
          .toArray();
        const pitchDeck = documents.find(
          (document) => document.category === "pitchDeck"
        );

        return {
          id: record._id,
          opportunity: toOpportunity(opportunityRecord),
          appliedAt: record.appliedAt.toISOString().slice(0, 10),
          statusUpdatedAt: (
            record.statusUpdatedAt ?? record.appliedAt
          ).toISOString(),
          status: record.status,
          documents: {
            pitchDeck: pitchDeck
              ? {
                  key: pitchDeck._id,
                  name: pitchDeck.name,
                  size: pitchDeck.size,
                }
              : undefined,
            certificates: documents
              .filter((document) => document.category === "certificate")
              .map(({ _id, name, size }) => ({ key: _id, name, size })),
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: applications.filter((application) => application !== null),
    });
  } catch (error) {
    console.error("[APPLICATIONS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Sign in to apply for an opportunity." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const opportunityId =
      typeof body.opportunityId === "string" ? body.opportunityId : "";
    const pitchDeckKey =
      typeof body.pitchDeckKey === "string" ? body.pitchDeckKey : null;
    const certificateKeys: string[] = Array.isArray(body.certificateKeys)
      ? body.certificateKeys.filter(
          (key: unknown): key is string => typeof key === "string"
        )
      : [];
    if (!opportunityId) {
      return NextResponse.json(
        { success: false, message: "Opportunity ID is required." },
        { status: 400 }
      );
    }
    if (
      certificateKeys.length > 3 ||
      (body.pitchDeckKey != null && typeof body.pitchDeckKey !== "string") ||
      (Array.isArray(body.certificateKeys) &&
        body.certificateKeys.some(
          (key: unknown) => typeof key !== "string"
        )) ||
      (body.certificateKeys != null &&
        !Array.isArray(body.certificateKeys)) ||
      new Set(certificateKeys).size !== certificateKeys.length ||
      (pitchDeckKey !== null && certificateKeys.includes(pitchDeckKey))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid application documents." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const uploadedKeys = [
      ...(pitchDeckKey ? [pitchDeckKey] : []),
      ...certificateKeys,
    ];
    const ownedUploads = uploadedKeys.length
      ? await db
          .collection<UserUploadDocument>("userUploads")
          .find({ _id: { $in: uploadedKeys }, userId: session.user.id })
          .toArray()
      : [];
    const hasValidPitchDeck =
      !pitchDeckKey ||
      ownedUploads.some(
        (upload) =>
          upload._id === pitchDeckKey && upload.category === "pitchDeck"
      );
    const validCertificateKeys = ownedUploads
      .filter((upload) => upload.category === "certificate")
      .map((upload) => upload._id);
    if (
      !hasValidPitchDeck ||
      validCertificateKeys.length !== certificateKeys.length
    ) {
      return NextResponse.json(
        { success: false, message: "One or more uploaded files are invalid." },
        { status: 400 }
      );
    }

    const opportunityRecord = await db
      .collection<OpportunityDocument>("opportunities")
      .findOne({ _id: opportunityId });
    if (!opportunityRecord) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found." },
        { status: 404 }
      );
    }

    const existing = await db.collection<ApplicationDocument>("applications").findOne({
      userId: session.user.id,
      opportunityId,
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "You have already applied to this opportunity." },
        { status: 409 }
      );
    }

    const application: ApplicationDocument = {
      _id: randomUUID(),
      userId: session.user.id,
      opportunityId,
      pitchDeckKey,
      certificateKeys,
      appliedAt: new Date(),
      status: "Under Review",
      statusUpdatedAt: new Date(),
    };
    await db.collection<ApplicationDocument>("applications").insertOne(application);

    const user = await db
      .collection<UserDocument>("users")
      .findOne({ _id: session.user.id });
    let confirmationEmailSent = false;
    if (user) {
      const emailResult = await sendApplicationConfirmationEmail(
        user.name,
        user.email,
        opportunityRecord.title,
        opportunityRecord.organization,
        opportunityRecord.county,
        opportunityRecord.grantAmountLabel
      );
      if (!emailResult.success) {
        console.error(
          "[APPLICATION_CONFIRMATION_EMAIL_WARNING]:",
          emailResult.error
        );
      } else {
        confirmationEmailSent = true;
      }
    }

    const uploads = ownedUploads.map(({ _id, name, size, category }) => ({
      key: _id,
      name,
      size,
      category,
    }));
    return NextResponse.json(
      {
        success: true,
        confirmationEmailSent,
        data: {
          id: application._id,
          opportunity: toOpportunity(opportunityRecord),
          appliedAt: application.appliedAt.toISOString().slice(0, 10),
          statusUpdatedAt: (
            application.statusUpdatedAt ?? application.appliedAt
          ).toISOString(),
          status: application.status,
          documents: {
            pitchDeck: uploads.find((upload) => upload.category === "pitchDeck"),
            certificates: uploads.filter(
              (upload) => upload.category === "certificate"
            ),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "You have already applied to this opportunity." },
        { status: 409 }
      );
    }
    console.error("[APPLICATIONS_CREATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit application." },
      { status: 500 }
    );
  }
}
