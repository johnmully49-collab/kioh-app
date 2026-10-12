import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { KENYA_COUNTIES } from "@/server/data/opportunities";
import {
  getDb,
  type UserDocument,
  type VentureDocument,
} from "@/server/lib/mongodb";
import {
  VENTURE_DOMAINS,
  VENTURE_STAGES,
  type Venture,
} from "@/server/types/venture";

function toPublicVenture(venture: VentureDocument): Venture {
  return {
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
  };
}

function isValidHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get("county") || "";
    const domain = searchParams.get("domain") || "";
    const query = (searchParams.get("q") || "").trim().slice(0, 100);

    if (
      (county && county !== "All Counties" && !KENYA_COUNTIES.includes(county)) ||
      (domain && domain !== "All domains" && !VENTURE_DOMAINS.includes(domain as (typeof VENTURE_DOMAINS)[number]))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid venture filter." },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { reviewStatus: "Approved" };
    if (county && county !== "All Counties") filter.county = county;
    if (domain && domain !== "All domains") filter.domain = domain;
    if (query) {
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeQuery, $options: "i" } },
        { tagline: { $regex: safeQuery, $options: "i" } },
        { description: { $regex: safeQuery, $options: "i" } },
        { founderOrganization: { $regex: safeQuery, $options: "i" } },
      ];
    }

    const ventures = await (await getDb())
      .collection<VentureDocument>("ventures")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({
      success: true,
      data: ventures.map(toPublicVenture),
    });
  } catch (error) {
    console.error("[VENTURES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load ventures." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Sign in to submit a venture." },
      { status: 401 }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Please check the venture details." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const tagline = typeof input.tagline === "string" ? input.tagline.trim() : "";
    const description =
      typeof input.description === "string" ? input.description.trim() : "";
    const domain = input.domain;
    const county = input.county;
    const stage = input.stage;
    const websiteUrl =
      typeof input.websiteUrl === "string" ? input.websiteUrl.trim() : "";
    const publicEmail =
      typeof input.publicEmail === "string"
        ? input.publicEmail.trim().toLowerCase()
        : "";
    const linkedinUrl =
      typeof input.linkedinUrl === "string" ? input.linkedinUrl.trim() : "";
    const publicContactConsent = input.publicContactConsent;

    if (
      name.length < 2 ||
      name.length > 100 ||
      tagline.length < 10 ||
      tagline.length > 180 ||
      description.length < 30 ||
      description.length > 2500 ||
      typeof domain !== "string" ||
      !VENTURE_DOMAINS.includes(domain as (typeof VENTURE_DOMAINS)[number]) ||
      typeof county !== "string" ||
      !KENYA_COUNTIES.includes(county) ||
      county === "All Counties" ||
      county === "Nationwide" ||
      typeof stage !== "string" ||
      !VENTURE_STAGES.includes(stage as (typeof VENTURE_STAGES)[number]) ||
      (websiteUrl && (websiteUrl.length > 500 || !isValidHttpsUrl(websiteUrl))) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail) ||
      publicEmail.length > 254 ||
      !linkedinUrl.startsWith("https://") ||
      linkedinUrl.length > 500 ||
      !isValidHttpsUrl(linkedinUrl) ||
      publicContactConsent !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please check each field. A public contact email, LinkedIn link, and contact-sharing consent are required.",
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const owner = await db.collection<UserDocument>("users").findOne(
      { _id: session.user.id },
      { projection: { name: 1, organization: 1 } }
    );
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Your account could not be found. Sign in again." },
        { status: 401 }
      );
    }

    const now = new Date();
    const venture: VentureDocument = {
      _id: randomUUID(),
      ownerId: session.user.id,
      name,
      tagline,
      description,
      domain: domain as VentureDocument["domain"],
      county,
      stage: stage as VentureDocument["stage"],
      websiteUrl: websiteUrl || null,
      publicEmail,
      linkedinUrl,
      founderName: owner.name,
      founderOrganization: owner.organization || null,
      reviewStatus: "Under Review",
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<VentureDocument>("ventures").insertOne(venture);

    return NextResponse.json(
      {
        success: true,
        message: "Your venture is submitted and will appear after admin review.",
        data: {
          id: venture._id,
          name: venture.name,
          reviewStatus: venture.reviewStatus,
          createdAt: now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[VENTURE_CREATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit your venture." },
      { status: 500 }
    );
  }
}
