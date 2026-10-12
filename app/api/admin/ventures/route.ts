import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, type VentureDocument } from "@/server/lib/mongodb";

async function getAdminSession() {
  const session = await auth();
  return session?.user?.role === "admin" ? session : null;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const ventures = await (await getDb())
      .collection<VentureDocument>("ventures")
      .find({ reviewStatus: "Under Review" })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: ventures.map((venture) => ({
        id: venture._id,
        name: venture.name,
        tagline: venture.tagline,
        description: venture.description,
        domain: venture.domain,
        county: venture.county,
        stage: venture.stage,
        websiteUrl: venture.websiteUrl,
        publicEmail: venture.publicEmail,
        linkedinUrl: venture.linkedinUrl,
        founderName: venture.founderName,
        founderOrganization: venture.founderOrganization,
        createdAt: venture.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[ADMIN_VENTURES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load venture submissions." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid review decision." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id : "";
    const decision = input.decision;
    if (!id || (decision !== "approve" && decision !== "reject")) {
      return NextResponse.json(
        { success: false, message: "Invalid review decision." },
        { status: 400 }
      );
    }

    const now = new Date();
    const result = await (await getDb())
      .collection<VentureDocument>("ventures")
      .updateOne(
        { _id: id, reviewStatus: "Under Review" },
        {
          $set: {
            reviewStatus: decision === "approve" ? "Approved" : "Rejected",
            reviewedAt: now,
            reviewedBy: session.user.id,
            updatedAt: now,
          },
        }
      );
    if (!result.modifiedCount) {
      return NextResponse.json(
        { success: false, message: "This venture is already reviewed or was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_VENTURE_REVIEW_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Could not save the venture review decision." },
      { status: 500 }
    );
  }
}
