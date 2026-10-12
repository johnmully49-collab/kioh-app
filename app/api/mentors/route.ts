import { NextResponse } from "next/server";
import { fetchAllMentors } from "@/server/services/mentorService";

export async function GET() {
  try {
    const mentors = await fetchAllMentors();
    return NextResponse.json({ success: true, data: mentors }, { status: 200 });
  } catch (error) {
    console.error("[MENTORS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch mentors." },
      { status: 500 }
    );
  }
}