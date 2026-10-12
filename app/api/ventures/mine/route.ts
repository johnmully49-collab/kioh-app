import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, type VentureDocument } from "@/server/lib/mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Sign in to view your venture submissions." },
      { status: 401 }
    );
  }

  try {
    const ventures = await (await getDb())
      .collection<VentureDocument>("ventures")
      .find(
        { ownerId: session.user.id },
        {
          projection: {
            _id: 1,
            name: 1,
            domain: 1,
            county: 1,
            reviewStatus: 1,
            createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: ventures.map((venture) => ({
        id: venture._id,
        name: venture.name,
        domain: venture.domain,
        county: venture.county,
        reviewStatus: venture.reviewStatus,
        createdAt: venture.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[MY_VENTURES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load your ventures." },
      { status: 500 }
    );
  }
}
