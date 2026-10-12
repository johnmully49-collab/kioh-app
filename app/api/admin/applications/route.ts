import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getDb,
  type ApplicationDocument,
  type OpportunityDocument,
  type UserDocument,
  type UserUploadDocument,
} from "@/server/lib/mongodb";

const ACTIVE_REVIEW_STATUSES = ["Under Review", "Shortlisted"] as const;
const APPLICATION_DECISIONS = ["shortlist", "accept", "reject"] as const;

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const db = await getDb();
    const records = await db
      .collection<ApplicationDocument>("applications")
      .find({ status: { $in: [...ACTIVE_REVIEW_STATUSES] } })
      .sort({ appliedAt: 1 })
      .limit(200)
      .toArray();
    const userIds = [...new Set(records.map(({ userId }) => userId))];
    const opportunityIds = [
      ...new Set(records.map(({ opportunityId }) => opportunityId)),
    ];
    const fileKeys = [
      ...new Set(
        records.flatMap((record) => [
          ...(record.pitchDeckKey ? [record.pitchDeckKey] : []),
          ...(record.certificateKeys ?? []),
        ])
      ),
    ];

    const [users, opportunities, uploads] = await Promise.all([
      userIds.length
        ? db
            .collection<UserDocument>("users")
            .find(
              { _id: { $in: userIds } },
              { projection: { _id: 1, name: 1, email: 1, location: 1, organization: 1 } }
            )
            .toArray()
        : [],
      opportunityIds.length
        ? db
            .collection<OpportunityDocument>("opportunities")
            .find(
              { _id: { $in: opportunityIds } },
              { projection: { _id: 1, title: 1, organization: 1, county: 1, category: 1, grantAmountLabel: 1 } }
            )
            .toArray()
        : [],
      fileKeys.length
        ? db
            .collection<UserUploadDocument>("userUploads")
            .find({ _id: { $in: fileKeys } })
            .toArray()
        : [],
    ]);
    const userById = new Map(users.map((user) => [user._id, user]));
    const opportunityById = new Map(
      opportunities.map((opportunity) => [opportunity._id, opportunity])
    );
    const uploadById = new Map(uploads.map((upload) => [upload._id, upload]));

    const applications = records.flatMap((record) => {
      const user = userById.get(record.userId);
      const opportunity = opportunityById.get(record.opportunityId);
      if (!user || !opportunity) return [];

      const documentKeys = [
        ...(record.pitchDeckKey ? [record.pitchDeckKey] : []),
        ...(record.certificateKeys ?? []),
      ];
      const documents = documentKeys.flatMap((key) => {
        const upload = uploadById.get(key);
        if (!upload || upload.userId !== record.userId) return [];
        return [
          {
            key,
            name: upload.name,
            category: upload.category,
          },
        ];
      });

      return [
        {
          id: record._id,
          applicant: {
            name: user.name,
            email: user.email,
            county: user.location || "Not provided",
            organization: user.organization || "",
          },
          opportunity: {
            title: opportunity.title,
            organization: opportunity.organization,
            county: opportunity.county,
            category: opportunity.category,
            grantAmountLabel: opportunity.grantAmountLabel,
          },
          appliedAt: record.appliedAt.toISOString(),
          status: record.status,
          documents,
        },
      ];
    });

    return NextResponse.json(
      { success: true, data: applications },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[ADMIN_APPLICATIONS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Could not load opportunity applications." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin" || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid application decision." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id.trim() : "";
    const decision = input.decision;
    if (
      !id ||
      typeof decision !== "string" ||
      !APPLICATION_DECISIONS.includes(
        decision as (typeof APPLICATION_DECISIONS)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Choose a valid application decision." },
        { status: 400 }
      );
    }

    const status =
      decision === "shortlist"
        ? "Shortlisted"
        : decision === "accept"
          ? "Accepted"
          : "Rejected";
    const now = new Date();
    const result = await (await getDb())
      .collection<ApplicationDocument>("applications")
      .updateOne(
        { _id: id, status: { $in: [...ACTIVE_REVIEW_STATUSES] } },
        {
          $set: {
            status,
            statusUpdatedAt: now,
            reviewedBy: session.user.id,
            ...(decision !== "shortlist" ? { reviewedAt: now } : {}),
          },
        }
      );

    if (result.modifiedCount !== 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This application is already finalized or is no longer available for review.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, status, statusUpdatedAt: now.toISOString() },
    });
  } catch (error) {
    console.error("[ADMIN_APPLICATION_DECISION_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Could not save the application decision." },
      { status: 500 }
    );
  }
}
