import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.email || !body.fullName) {
      return NextResponse.json(
        { success: false, message: "Name and Email are required." },
        { status: 400 }
      );
    }

    // Here you can insert 'body' into your database or send a confirmation email
    console.log("New application received:", body);

    return NextResponse.json(
      { success: true, message: "Application submitted successfully!" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error processing application." },
      { status: 500 }
    );
  }
}