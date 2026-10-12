import { NextResponse } from "next/server";
import { fetchAllStakeholders } from "@/server/services/stakeholderService";

export async function GET() {
  try {
    const stakeholders = await fetchAllStakeholders();
    return NextResponse.json({ success: true, data: stakeholders }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch stakeholders data" },
      { status: 500 }
    );
  }
}