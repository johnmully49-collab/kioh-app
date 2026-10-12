import { NextResponse } from "next/server";
import { sendPasswordResetLink } from "@/server/actions/emailActions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetLink(body.email);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("[RESET_PASSWORD_REQUEST_ERROR]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to initiate password reset." },
      { status: 500 }
    );
  }
}
