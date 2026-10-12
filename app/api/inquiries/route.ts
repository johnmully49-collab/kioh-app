import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, type EcosystemInquiryDocument } from "@/server/lib/mongodb";

const ROLES = ["builder", "mentor", "donor", "partner"] as const;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Please check the form and try again." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const organization = typeof input.organization === "string" ? input.organization.trim() : "";
    const location = typeof input.location === "string" ? input.location.trim() : "";
    const interest = typeof input.interest === "string" ? input.interest.trim() : "";
    const role = input.role;
    const publicOrganizationConsent =
      input.publicOrganizationConsent === true;

    if (
      fullName.length < 2 ||
      fullName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      organization.length > 160 ||
      (role === "partner" && organization.length < 2) ||
      (role === "partner" &&
        typeof input.publicOrganizationConsent !== "boolean") ||
      !location ||
      location.length > 100 ||
      interest.length < 10 ||
      interest.length > 2000 ||
      typeof role !== "string" ||
      !ROLES.includes(role as (typeof ROLES)[number])
    ) {
      return NextResponse.json(
        { success: false, message: "Please review the required fields and try again." },
        { status: 400 }
      );
    }

    const inquiry: EcosystemInquiryDocument = {
      _id: randomUUID(),
      fullName,
      email,
      organization,
      location,
      interest,
      role: role as EcosystemInquiryDocument["role"],
      createdAt: new Date(),
      ...(role === "partner"
        ? {
            publicOrganizationConsent,
            verificationStatus: "Under Review" as const,
          }
        : {}),
    };

    const db = await getDb();
    await db.collection<EcosystemInquiryDocument>("ecosystemInquiries").insertOne(inquiry);

    return NextResponse.json(
      {
        success: true,
        message: "Your enquiry has been received. Thank you for reaching out.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ECOSYSTEM_INQUIRY_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "We could not submit your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
