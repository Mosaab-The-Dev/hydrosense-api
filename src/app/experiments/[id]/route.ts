import { db } from "@/db";
import { experiments, experimentsBank } from "../../../../drizzle/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openaiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: openaiKey,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using them
    const { id } = await params;

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

    const { ph, tds, turbidity } = body;

    // Validate that at least one sensor value is provided
    if (ph === undefined && tds === undefined && turbidity === undefined) {
      return NextResponse.json(
        {
          error: "At least one sensor value (ph, tds, turbidity) is required",
        },
        { status: 400 }
      );
    }

    // Validate UUID format for experiment id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid UUID format for experiment ID" },
        { status: 400 }
      );
    }

    // Build the update object with only provided values
    const updateData: any = {};
    if (ph !== undefined) updateData.ph = ph.toString();
    if (tds !== undefined) updateData.tds = tds.toString();
    if (turbidity !== undefined) updateData.turbidity = turbidity.toString();

    // Call OpenAI to analyze the water quality data
    const prompt = `You are a water quality expert. Analyze the following water quality test results and provide a comprehensive assessment:

pH: ${ph !== undefined ? ph : "Not measured"}
TDS (Total Dissolved Solids): ${
      tds !== undefined ? tds + " ppm" : "Not measured"
    }
Turbidity: ${turbidity !== undefined ? turbidity + " NTU" : "Not measured"}

Please provide:
1. A summary of the results (2-3 sentences) - explain what these values mean and whether they indicate good or poor water quality
2. If the water quality is not optimal, provide specific solutions and recommendations to improve it

Format your response as JSON with two fields: "summary" and "solution". If the water quality is good, set "solution" to an empty string.`;

    let summary = "";
    let solution = "";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a water quality expert. Provide clear, concise analysis in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      summary = result.summary || "";
      solution = result.solution || "";
    } catch (aiError) {
      console.error("Error calling OpenAI:", aiError);
      // Continue without AI analysis if it fails
      summary = "AI analysis unavailable at this time.";
      solution = "";
    }

    // Add AI-generated content to update data
    updateData.summary = summary;
    updateData.solution = solution;

    // Update experiment with sensor data and AI analysis
    const updatedExperiment = await db
      .update(experiments)
      .set(updateData)
      .where(eq(experiments.id, id))
      .returning();

    // Check if experiment exists
    if (updatedExperiment.length === 0) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Find similar experiments from experimentsBank
    let similarExperimentAnalysis = "";

    try {
      // Fetch all experiments from experimentsBank
      const bankExperiments = await db.select().from(experimentsBank);

      if (bankExperiments.length > 0) {
        // Prepare data for OpenAI to find the most similar experiment
        const similarityPrompt = `You are a water quality data analyst. I have water quality test results from a new experiment:
pH: ${ph !== undefined ? ph : "Not measured"}
TDS (Total Dissolved Solids): ${
          tds !== undefined ? tds + " ppm" : "Not measured"
        }
Turbidity: ${turbidity !== undefined ? turbidity + " NTU" : "Not measured"}

Here is a list of historical experiments from our database:
${bankExperiments
  .map(
    (exp, idx) =>
      `Experiment ${idx + 1}: pH=${exp.ph || "N/A"}, TDS=${
        exp.tds || "N/A"
      } ppm, Turbidity=${exp.turbidity || "N/A"} NTU, Longitude=${
        exp.longitude || "N/A"
      }, Latitude=${exp.latitude || "N/A"}, Date=${exp.date || "N/A"}, Time=${
        exp.time || "N/A"
      }`
  )
  .join("\n")}

Please analyze these historical experiments and identify which one has the most similar pH, TDS, and turbidity values to the new experiment. Write a brief analysis (2-3 sentences) explaining which experiment is most similar, why it's similar, and translate the longitude and latitude coordinates into the country name where that experiment was conducted. Write naturally in plain text, as if explaining to a colleague.`;

        const similarityCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a water quality data analyst. Write clear, natural explanations in plain text.",
            },
            {
              role: "user",
              content: similarityPrompt,
            },
          ],
        });

        similarExperimentAnalysis =
          similarityCompletion.choices[0].message.content || "";
      }
    } catch (similarityError) {
      console.error("Error finding similar experiments:", similarityError);
      // Continue without similarity analysis if it fails
    }

    const response: any = {
      message:
        "Experiment updated with sensor data and AI analysis successfully",
      experiment: updatedExperiment[0],
    };

    // Add similar experiment analysis if available
    if (similarExperimentAnalysis) {
      response.similarExperimentAnalysis = similarExperimentAnalysis;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error updating experiment:", error);
    return NextResponse.json(
      { error: "Failed to update experiment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using them
    const { id } = await params;

    // Validate UUID format for experiment id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid UUID format for experiment ID" },
        { status: 400 }
      );
    }

    // Fetch experiment by ID
    const experiment = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id))
      .limit(1);

    // Check if experiment exists
    if (experiment.length === 0) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        experiment: experiment[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching experiment:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiment" },
      { status: 500 }
    );
  }
}
