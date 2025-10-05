import { db } from "@/db";
import { experiments } from "../../../drizzle/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

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

    const { userId, name, description } = body;

    // Validate required fields
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Valid userId (Supabase auth UID) is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Valid experiment name is required" },
        { status: 400 }
      );
    }

    // Validate UUID format for userId
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Invalid UUID format for userId" },
        { status: 400 }
      );
    }

    // Create new experiment with only name and description
    const experiment = await db
      .insert(experiments)
      .values({
        userId: userId,
        name: name,
        description: description || null,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Experiment created successfully",
        experimentId: experiment[0].id,
        experiment: experiment[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating experiment:", error);
    return NextResponse.json(
      { error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Validate userId presence and format
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: "Invalid UUID format for userId" },
        { status: 400 }
      );
    }

    // Fetch all experiments for the user
    const userExperiments = await db
      .select()
      .from(experiments)
      .where(eq(experiments.userId, userId));

    return NextResponse.json({ experiments: userExperiments }, { status: 200 });
  } catch (error) {
    console.error("Error getting experiments:", error);
    return NextResponse.json(
      { error: "Failed to get experiments" },
      { status: 500 }
    );
  }
}
