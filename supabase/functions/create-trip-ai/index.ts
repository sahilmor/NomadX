// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Deno global is available in Supabase Edge Functions runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface TripRequest {
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  description?: string;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, content-type",
        },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const tripRequest: TripRequest = await req.json();

    // Validate required fields
    if (!tripRequest.title || !tripRequest.startDate || !tripRequest.endDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, startDate, endDate" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare prompt for Gemini
    const prompt = `Create a detailed travel itinerary for the following trip:
Title: ${tripRequest.title}
Start Date: ${tripRequest.startDate}
End Date: ${tripRequest.endDate}
Budget: ${tripRequest.budget || "Not specified"} ${tripRequest.currency || "USD"}
Description: ${tripRequest.description || "No description provided"}

Please provide:
1. A suggested day-by-day itinerary
2. Recommended destinations/cities
3. Estimated costs breakdown
4. Travel tips
5. Must-see attractions

Return the response as a structured JSON object with the following format:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": ["activity1", "activity2"],
      "estimatedCost": 100,
      "location": "City Name"
    }
  ],
  "recommendations": {
    "destinations": ["city1", "city2"],
    "attractions": ["attraction1", "attraction2"],
    "tips": ["tip1", "tip2"]
  },
  "budgetBreakdown": {
    "accommodation": 500,
    "food": 300,
    "transportation": 200,
    "activities": 150
  }
}`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error("Gemini API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate trip with AI", details: error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from AI response
    let aiItinerary;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      aiItinerary = JSON.parse(jsonString);
    } catch (e) {
      // If parsing fails, create a structured response from text
      aiItinerary = {
        itinerary: [],
        recommendations: {
          destinations: [],
          attractions: [],
          tips: [aiContent.substring(0, 500)]
        },
        budgetBreakdown: {},
        rawResponse: aiContent
      };
    }

    // Create trip in database
    const tripData = {
      ownerId: user.id,
      title: tripRequest.title,
      startDate: tripRequest.startDate,
      endDate: tripRequest.endDate,
      budgetCap: tripRequest.budget || null,
      currency: tripRequest.currency || "USD",
      visibility: "PRIVATE" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: trip, error: tripError } = await supabase
      .from("Trip")
      .insert(tripData)
      .select()
      .single();

    if (tripError) {
      console.error("Error creating trip:", tripError);
      return new Response(
        JSON.stringify({ error: "Failed to create trip", details: tripError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return trip with AI-generated itinerary
    return new Response(
      JSON.stringify({
        trip,
        aiItinerary,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-trip-ai:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

