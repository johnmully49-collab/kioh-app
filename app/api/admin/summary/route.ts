import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getDb,
  type ApplicationDocument,
  type EcosystemInquiryDocument,
  type MentorApplicationDocument,
  type OpportunityDocument,
  type UserDocument,
  type VentureDocument,
} from "@/server/lib/mongodb";

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
    const today = new Date().toISOString().slice(0, 10);
    const [
      members,
      activeOpportunities,
      applications,
      pendingMentorApplications,
      pendingPartnerInquiries,
      pendingVentures,
      pendingOpportunityApplications,
    ] = await Promise.all([
      db.collection<UserDocument>("users").countDocuments({}),
      db.collection<OpportunityDocument>("opportunities").countDocuments({
        deadline: { $gte: today },
      }),
      db.collection<ApplicationDocument>("applications").countDocuments({}),
      db
        .collection<MentorApplicationDocument>("mentorApplications")
        .countDocuments({ status: "Under Review" }),
      db.collection<EcosystemInquiryDocument>("ecosystemInquiries").countDocuments({
        role: "partner",
        organization: { $ne: "" },
        $or: [
          { verificationStatus: "Under Review" },
          { verificationStatus: { $exists: false } },
        ],
      }),
      db.collection<VentureDocument>("ventures").countDocuments({
        reviewStatus: "Under Review",
      }),
      db.collection<ApplicationDocument>("applications").countDocuments({
        status: { $in: ["Under Review", "Shortlisted"] },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          members,
          activeOpportunities,
          applications,
          pendingMentorApplications,
          pendingPartnerInquiries,
          pendingVentures,
          pendingOpportunityApplications,
          totalPendingReviews:
            pendingOpportunityApplications +
            pendingMentorApplications +
            pendingPartnerInquiries +
            pendingVentures,
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[ADMIN_SUMMARY_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Could not load the admin overview." },
      { status: 500 }
    );
  }
}
