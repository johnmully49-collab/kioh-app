import { NextResponse } from "next/server";
import { getDb, type VerifiedOrganizationDocument } from "@/server/lib/mongodb";

export async function GET() {
  try {
    const organizations = await (await getDb())
      .collection<VerifiedOrganizationDocument>("verifiedOrganizations")
      .find({ publicConsent: true })
      .sort({ name: 1 })
      .project<{ name: string; verifiedAt: Date }>({
        _id: 0,
        name: 1,
        verifiedAt: 1,
      })
      .toArray();

    return NextResponse.json({ success: true, data: organizations });
  } catch (error) {
    console.error("[VERIFIED_ORGANIZATIONS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load verified partners." },
      { status: 500 }
    );
  }
}
