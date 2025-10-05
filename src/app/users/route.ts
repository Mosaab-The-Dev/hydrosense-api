import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "../../../drizzle/schema";

export async function POST(request: NextRequest) {
  try {
    // Check content-type header
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Parse JSON with better error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { id, email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        id: id,
        email: email,
      })
      .returning();

    return NextResponse.json(
      {
        message: "User created successfully",
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
