import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { KENYA_COUNTIES } from "@/server/data/opportunities";
import {
  getDb,
  type ApplicationDocument,
  type EcosystemInquiryDocument,
  type MentorApplicationDocument,
  type OpportunityDocument,
  type UserDocument,
  type VentureDocument,
} from "@/server/lib/mongodb";
import type {
  CountyFundingListings,
  CountyMemberCount,
  EcosystemAnalytics,
  MonthlyEngagement,
  VentureSectorCount,
} from "@/server/types/analytics";

interface CountByKey {
  _id: string;
  count: number;
}

interface OpportunityCountByCounty {
  _id: string;
  count: number;
}

interface MonthlyCount {
  _id: string;
  count: number;
}

const PRIVATE_COHORT_THRESHOLD = 5;
const COUNTY_SET = new Set(
  KENYA_COUNTIES.filter(
    (county) =>
      county !== "All Counties" && county !== "Nationwide"
  )
);

function getMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function getMonthLabel(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString("en-KE", {
    month: "short",
    timeZone: "UTC",
  });
}

function suppressSmallCount(count: number, isPartner: boolean) {
  return isPartner && count > 0 && count < PRIVATE_COHORT_THRESHOLD
    ? null
    : count;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Sign in to view ecosystem analytics." },
      { status: 401 }
    );
  }
  if (session.user.role !== "admin" && session.user.role !== "funder") {
    return NextResponse.json(
      { success: false, message: "Ecosystem analytics are for approved partners." },
      { status: 403 }
    );
  }

  try {
    const db = await getDb();
    const isPartner = session.user.role === "funder";
    if (isPartner) {
      const email = session.user.email?.trim().toLowerCase();
      const approvedPartnerInquiry = email
        ? await db.collection<EcosystemInquiryDocument>("ecosystemInquiries").findOne(
            {
              email,
              role: "partner",
              verificationStatus: "Approved",
            },
            { projection: { _id: 1 } }
          )
        : null;
      if (!approvedPartnerInquiry) {
        return NextResponse.json(
          {
            success: false,
            message: "Analytics access requires an approved partner account.",
          },
          { status: 403 }
        );
      }
    }
    const now = new Date();
    const firstMonth = getMonthStart(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
    );
    const endMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );
    const today = now.toISOString().slice(0, 10);
    const users = db.collection<UserDocument>("users");
    const applications = db.collection<ApplicationDocument>("applications");
    const ventures = db.collection<VentureDocument>("ventures");
    const opportunities = db.collection<OpportunityDocument>("opportunities");
    const mentorApplications =
      db.collection<MentorApplicationDocument>("mentorApplications");

    const [
      memberTotal,
      applicationTotal,
      fundingListingTotal,
      approvedVentureTotal,
      mentorApplicationTotal,
      memberTrendRows,
      applicationTrendRows,
      ventureTrendRows,
      fundingRows,
      memberCountyRows,
      sectorRows,
    ] = await Promise.all([
      users.countDocuments({}),
      applications.countDocuments({}),
      opportunities.countDocuments({
        category: "Grants & Funding",
        deadline: { $gte: today },
        grantAmount: { $gt: 0 },
      }),
      ventures.countDocuments({ reviewStatus: "Approved" }),
      mentorApplications.countDocuments({}),
      users
        .aggregate<MonthlyCount>([
          { $match: { createdAt: { $gte: firstMonth, $lt: endMonth } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      applications
        .aggregate<MonthlyCount>([
          { $match: { appliedAt: { $gte: firstMonth, $lt: endMonth } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$appliedAt", timezone: "UTC" },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      ventures
        .aggregate<MonthlyCount>([
          { $match: { createdAt: { $gte: firstMonth, $lt: endMonth } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" },
              },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      opportunities
        .aggregate<OpportunityCountByCounty>([
          {
            $match: {
              category: "Grants & Funding",
              deadline: { $gte: today },
              grantAmount: { $gt: 0 },
              county: { $nin: ["All Counties"] },
            },
          },
          { $group: { _id: "$county", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ])
        .toArray(),
      users
        .aggregate<CountByKey>([
          { $match: { location: { $type: "string", $ne: "" } } },
          { $group: { _id: "$location", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ])
        .toArray(),
      ventures
        .aggregate<CountByKey>([
          { $match: { reviewStatus: "Approved" } },
          { $group: { _id: "$domain", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
        ])
        .toArray(),
    ]);

    const memberTrend = new Map(memberTrendRows.map(({ _id, count }) => [_id, count]));
    const applicationTrend = new Map(
      applicationTrendRows.map(({ _id, count }) => [_id, count])
    );
    const ventureTrend = new Map(ventureTrendRows.map(({ _id, count }) => [_id, count]));
    const monthlyEngagement: MonthlyEngagement[] = [];
    for (let month = new Date(firstMonth); month < endMonth; month.setUTCMonth(month.getUTCMonth() + 1)) {
      const monthKey = getMonthKey(month);
      monthlyEngagement.push({
        month: monthKey,
        label: getMonthLabel(monthKey),
        members: suppressSmallCount(memberTrend.get(monthKey) ?? 0, isPartner),
        applications: suppressSmallCount(
          applicationTrend.get(monthKey) ?? 0,
          isPartner
        ),
        ventures: suppressSmallCount(ventureTrend.get(monthKey) ?? 0, isPartner),
      });
    }

    const normalizedMemberRows = memberCountyRows.map(({ _id, count }) => ({
      county: COUNTY_SET.has(_id) ? _id : "Other / not specified",
      count,
    }));
    const memberCountByCounty = new Map<string, number>();
    for (const row of normalizedMemberRows) {
      memberCountByCounty.set(
        row.county,
        (memberCountByCounty.get(row.county) ?? 0) + row.count
      );
    }
    const membersByCounty: CountyMemberCount[] = [];
    let suppressedCountyCounts = 0;
    for (const [county, count] of memberCountByCounty) {
      if (isPartner && count > 0 && count < PRIVATE_COHORT_THRESHOLD) {
        suppressedCountyCounts += 1;
        continue;
      }
      membersByCounty.push({ county, count });
    }
    membersByCounty.sort((left, right) => right.count - left.count);

    const analytics: EcosystemAnalytics = {
      generatedAt: now.toISOString(),
      totals: {
        members: memberTotal,
        opportunityApplications: applicationTotal,
        activeFundingListings: fundingListingTotal,
        approvedVentures: approvedVentureTotal,
        mentorApplications: mentorApplicationTotal,
      },
      monthlyEngagement,
      fundingByCounty: fundingRows.reduce<CountyFundingListings[]>(
        (result, row) => {
          if (COUNTY_SET.has(row._id) || row._id === "Nationwide") {
            result.push({ county: row._id, count: row.count });
          }
          return result;
        },
        []
      ),
      membersByCounty,
      venturesBySector: sectorRows.map<VentureSectorCount>((row) => ({
        sector: row._id,
        count: row.count,
      })),
      suppressedCountyCounts,
    };

    return NextResponse.json(
      { success: true, data: analytics },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[ANALYTICS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load ecosystem analytics." },
      { status: 500 }
    );
  }
}
