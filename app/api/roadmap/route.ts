import { NextResponse } from "next/server";
import { fetchRoadmapMilestones } from "@/server/services/roadmapService";

export async function GET() {
  try {
    const roadmap = await fetchRoadmapMilestones();
    return NextResponse.json({ success: true, data: roadmap }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch roadmap data" },
      { status: 500 }
    );
  }
}