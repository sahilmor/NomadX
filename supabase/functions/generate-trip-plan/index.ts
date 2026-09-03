// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://x-nomad.vercel.app",
  "http://localhost:8080",
];

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare const crypto: {
  randomUUID(): string;
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

interface GeneratePlanRequest {
  tripId: string;
  title: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  description?: string;
  travelers?: number;
}

serve(async (req: {
  headers: { get: (name: string) => string | null };
  method: string;
  json: () => Promise<GeneratePlanRequest>;
}) => {
  // --- SECRETS READ INSIDE THE HANDLER ---
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  // Basic CORS handling
  const origin = req.headers.get("Origin") || "";
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": isAllowedOrigin
      ? origin
      : ALLOWED_ORIGINS[0],
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      req.headers.get("Access-Control-Request-Headers") ||
      "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers": "Content-Length, Content-Type",
  };

  if (req.method === "OPTIONS") {
    // Preflight
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!isAllowedOrigin) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    // --- VALIDATE ALL SECRETS ---
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Supabase internal configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured. Please set the secret in your Supabase project." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authorization header (client session token)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // init supabase client (server-side)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // verify user token provided by client
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // parse request body
    const planRequest = await req.json();

    // required fields
    if (
      !planRequest.tripId ||
      !planRequest.title ||
      !planRequest.startDate ||
      !planRequest.endDate
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: tripId, title, startDate, endDate",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // compute days (inclusive)
    const start = new Date(planRequest.startDate);
    const end = new Date(planRequest.endDate);
    const days =
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // Build prompt (same structure you provided)
    const prompt = `You are an expert travel planner specializing in budget-friendly, off-beat, and authentic travel experiences. Create a comprehensive, detailed travel plan for the following trip:

TRIP DETAILS:
- Title: ${planRequest.title}
- Start Date: ${planRequest.startDate}
- End Date: ${planRequest.endDate}
- Duration: ${days} days
- Budget: ${planRequest.budget ? `${planRequest.budget} ${planRequest.currency || "INR"}` : "Flexible budget"}
- Number of Travelers: ${planRequest.travelers || 1}
- Description: ${planRequest.description || "General travel experience"}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:

{
  "cityStops": [
    {
      "tempId": "c1",
      "name": "City Name",
      "lat": 40.7128,
      "lng": -74.0060,
      "arrival": "YYYY-MM-DD",
      "departure": "YYYY-MM-DD",
      "order": 1,
      "notes": "Why visit this city, what makes it special"
    }
  ],
  "transportation": {
    "routes": [
      {
        "from": "City A",
        "to": "City B",
        "options": [
          {
            "mode": "flight/train/bus/ferry",
            "duration": "2 hours",
            "cost": 50,
            "currency": "INR",
            "tips": "Best time to book, booking sites"
          }
        ]
      }
    ],
    "localTransport": {
      "city": "City Name",
      "modes": ["metro", "bus", "bike", "walking"],
      "recommendations": "Best way to get around",
      "cost": "Daily pass cost"
    },
    "localTransportOptions": [
      {
        "city": "City Name",
        "mode": "BIKE_RENTAL/SCOOTY_RENTAL/CAB/AUTO_RICKSHAW/METRO/BUS/WALK",
        "cost": 350,
        "currency": "INR",
        "duration": "Per day / per ride",
        "tips": "Where to rent, price negotiation, when this option makes sense"
      }
    ]
  },
  "accommodation": [
    {
      "city": "City Name",
      "budget": {
        "type": "hostel",
        "name": "Example Hostel",
        "cost": 20,
        "currency": "INR",
        "location": "Near city center"
      },
      "midrange": {
        "type": "hotel",
        "name": "Example Hotel",
        "cost": 60,
        "currency": "INR"
      },
      "unique": {
        "type": "homestay",
        "name": "Local Experience",
        "cost": 35,
        "currency": "INR"
      }
    }
  ],
  "food": [
    {
      "city": "City Name",
      "mustTry": ["Dish 1", "Dish 2"],
      "budgetRestaurants": [
        {
          "name": "Restaurant Name",
          "type": "Street food/Local eatery",
          "specialty": "What to order",
          "cost": 5,
          "location": "Area/Street name"
        }
      ],
      "markets": ["Market name and what to find"],
      "tips": "Food tips for this city"
    }
  ],
  "pois": [
    {
      "tempId": "p1",
      "cityTempId": "c1",
      "name": "Attraction/Location Name",
      "lat": 40.7128,
      "lng": -74.0060,
      "city": "City Name",
      "style": "famous/offbeat",
      "category": "museum/beach/hiking/cultural",
      "description": "Why visit, what to expect",
      "cost": 10,
      "currency": "INR",
      "duration": "2-3 hours",
      "bestTime": "Morning/Afternoon",
      "tips": "Booking info, insider tips"
    }
  ],
  "itinerary": [
    {
      "day": "Day 1",
      "date": "YYYY-MM-DD",
      "city": "City Name",
      "items": [
        {
          "title": "Activity Name",
          "poiTempId": "p1",
          "kind": "SIGHT/FOOD/ACTIVITY/MOVE/STAY/REST",
          "startTime": "09:00",
          "endTime": "11:00",
          "cost": 10,
          "notes": "Tips, what to bring, what to expect"
        }
      ]
    }
  ],
  "budgetBreakdown": {
    "accommodation": 300,
    "food": 200,
    "transportation": 400,
    "activities": 150,
    "miscellaneous": 50,
    "total": 1100,
    "currency": "INR"
  },
  "tips": [
    "General travel tip 1",
    "Money-saving tip 2",
    "Safety tip 3"
  ],
  "guide": {
    "bestTime": "When to visit",
    "customs": "Local customs to know",
    "language": "Basic phrases",
    "safety": "Safety considerations",
    "packing": "What to pack",
    "visa": "Visa requirements",
    "currency": "Currency and payment tips"
  }
}

IMPORTANT:
- Generate AT LEAST 12 POIs total (for a multi-day trip, aim for 5-8 per day) — a plan with only a handful of places is a failure
- Include a mix of famous AND off-beat locations (at least 30% off-beat/hidden gems)
- Every day in the itinerary MUST have 4-7 scheduled items with specific times
- For accommodation: ALWAYS give all three tiers (budget/midrange/unique) per city with REALISTIC prices for that city, real hostels/hotels/homestays where possible
- For transportation: ALWAYS include budget alternates — bike/scooty rentals, local buses, metro, autos — alongside cabs and flights, with realistic per-day or per-ride costs and money-saving tips
- Provide realistic coordinates (lat/lng) for all locations
- Ensure all dates are within the trip duration
- Make activities budget-friendly but also include premium options
- Be specific with locations, not generic
- Include practical tips and insider knowledge
- Consider the number of travelers in recommendations`;

    // Call Gemini (with model fallbacks — a 503 on one model shouldn't kill the plan)
    // NOTE: verified live on 2026-09-03 — gemini-flash-latest hangs >120s and
    // 2.5/2.0-flash return 404 for new API keys. flash-lite answers in ~7-11s.
    const GEMINI_MODELS = [
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
    ];

    let geminiResponse: Response | null = null;
    let lastGeminiError = "";
    for (const model of GEMINI_MODELS) {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      };
      const attempt = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig,
          }),
        }
      );
      if (attempt.ok) {
        geminiResponse = attempt;
        break;
      }
      lastGeminiError = await attempt.text();
      console.error(`Gemini model ${model} failed:`, lastGeminiError);
      // Only fall through to the next model on transient/server errors
      if (attempt.status !== 503 && attempt.status !== 429 && attempt.status >= 500) break;
    }

    if (!geminiResponse) {
      const errText = lastGeminiError;
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({
          error: "Failed to generate travel plan",
          details: errText,
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from AI
    let travelPlan: any;
    try {
      // --- THIS IS THE FIX ---
      // Clean the string before parsing:
      // 1. Find the first '{'
      // 2. Find the last '}'
      // 3. Extract everything in between.
      const startIndex = aiContent.indexOf('{');
      const endIndex = aiContent.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("No valid JSON object found in AI response.");
      }

      const jsonString = aiContent.substring(startIndex, endIndex + 1);
      travelPlan = JSON.parse(jsonString);
      
    } catch (e: any) {
      console.error("Error parsing AI response:", e.message);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          details: e.message,
          rawResponse: aiContent.substring(0, 500), // Show start of bad response
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // --- SAVE DATA TO DATABASE ---
    const savedData: Record<string, any> = {};

    // Helper maps to convert AI tempIds to DB UUIDs
    const cityTempIdToDbIdMap = new Map<string, string>();
    const poiTempIdToDbIdMap = new Map<string, string>();

    // 1) CityStops
    if (Array.isArray(travelPlan.cityStops) && travelPlan.cityStops.length) {
      const cityStopPayload: any[] = travelPlan.cityStops.map(
        (stop: any, index: number) => {
          const newId = crypto.randomUUID();
          cityTempIdToDbIdMap.set(stop.tempId, newId);
          return {
            id: newId,
            tripId: planRequest.tripId,
            name: stop.name || `City ${index + 1}`,
            lat: stop.lat ?? 0,
            lng: stop.lng ?? 0,
            arrival: stop.arrival || planRequest.startDate,
            departure: stop.departure || planRequest.endDate,
            order: stop.order ?? index,
            notes: stop.notes || null,
          };
        }
      );

      const { data: cityStops, error: cityStopsError } = await supabase
        .from("CityStop")
        .insert(cityStopPayload)
        .select();

      savedData.cityStops = cityStops || [];
      if (cityStopsError) console.error("Error saving city stops:", cityStopsError);
    }

    // 2) POIs
    if (Array.isArray(travelPlan.pois) && travelPlan.pois.length) {
      const poiPayload: any[] = travelPlan.pois.map((poi: any) => {
        const newId = crypto.randomUUID();
        poiTempIdToDbIdMap.set(poi.tempId, newId);
        return {
          id: newId,
          tripId: planRequest.tripId,
          name: poi.name,
          lat: poi.lat ?? 0,
          lng: poi.lng ?? 0,
          cityStopId: cityTempIdToDbIdMap.get(poi.cityTempId) || null,
          tags: poi.style ? [poi.style, poi.category].filter(Boolean) : null,
          photoUrl: poi.photoUrl || null,
          websiteUrl: poi.websiteUrl || null,
          rating: poi.rating ?? null,
          priceLevel: poi.priceLevel ?? null,
          externalId: null,
          description: poi.description || null,
          cost: poi.cost ?? null,
          duration: poi.duration || null,
        };
      });

      const { data: pois, error: poisError } = await supabase
        .from("Poi")
        .insert(poiPayload)
        .select();

      savedData.pois = pois || [];
      if (poisError) console.error("Error saving POIs:", poisError);
    }

    // 3) Itinerary items
    if (Array.isArray(travelPlan.itinerary) && travelPlan.itinerary.length) {
      // AI sometimes sends time-only strings ("10:00") which Postgres rejects
      // for a timestamp column — that fails the ENTIRE batch insert. Sanitize.
      const toTimestamp = (dateStr: string | undefined, timeStr: string | null | undefined): string | null => {
        if (!timeStr || typeof timeStr !== "string") return null;
        const t = timeStr.trim();
        // Already a full date or ISO datetime
        if (/^\d{4}-\d{2}-\d{2}(T| )/.test(t)) return t.replace(" ", "T");
        // Time-only: combine with the day's date
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t) && dateStr) {
          return `${dateStr}T${t.length === 5 ? t + ":00" : t}`;
        }
        return null;
      };

      const itineraryItemsPayload: any[] = [];
      travelPlan.itinerary.forEach((day: any) => {
        if (Array.isArray(day.items)) {
          day.items.forEach((item: any) => {
            itineraryItemsPayload.push({
              id: crypto.randomUUID(),
              tripId: planRequest.tripId,
              day: day.date || planRequest.startDate,
              title: item.title,
              kind: item.kind || "ACTIVITY",
              startTime: toTimestamp(day.date, item.startTime),
              endTime: toTimestamp(day.date, item.endTime),
              cost: item.cost ?? null,
              notes: item.notes || null,
              poiId: poiTempIdToDbIdMap.get(item.poiTempId) || null,
            });
          });
        }
      });

      if (itineraryItemsPayload.length) {
        const { data: items, error: itemsError } = await supabase
          .from("ItineraryItem")
          .insert(itineraryItemsPayload)
          .select();

        if (itemsError) {
          // Don't let one bad row nuke the batch — retry row by row
          console.error("Batch itinerary insert failed, falling back to per-row:", itemsError);
          const okRows: any[] = [];
          for (const row of itineraryItemsPayload) {
            const { data: one, error: oneErr } = await supabase
              .from("ItineraryItem")
              .insert(row)
              .select();
            if (oneErr) {
              console.error("Dropping invalid itinerary row:", row.title, oneErr.message);
            } else if (one) {
              okRows.push(...one);
            }
          }
          savedData.itineraryItems = okRows;
        } else {
          savedData.itineraryItems = items || [];
        }
      } else {
        savedData.itineraryItems = [];
      }
    }

    // 4) Stays (accommodation tiers per city)
    const cityNameToDbId = new Map<string, string>();
    savedData.cityStops?.forEach((cs: any) => {
      if (cs?.name) cityNameToDbId.set(cs.name.toLowerCase(), cs.id);
    });

    if (Array.isArray(travelPlan.accommodation) && travelPlan.accommodation.length) {
      const stayPayload: any[] = [];
      travelPlan.accommodation.forEach((cityAcc: any) => {
        const cityStopId = cityNameToDbId.get((cityAcc.city || "").toLowerCase()) || null;
        for (const tier of ["budget", "midrange", "unique"]) {
          const opt = cityAcc[tier];
          if (!opt || opt.cost == null) continue;
          stayPayload.push({
            id: crypto.randomUUID(),
            tripId: planRequest.tripId,
            cityStopId,
            name: opt.name || `${tier} stay`,
            type: (opt.type || tier).toUpperCase(),
            tier: tier.toUpperCase(),
            costPerNight: Number(opt.cost) || 0,
            currency: opt.currency || planRequest.currency || "INR",
            location: opt.location || null,
            description: null,
            nights: 0,
          });
        }
      });

      if (stayPayload.length) {
        const { data: stays, error: staysError } = await supabase
          .from("Stay")
          .insert(stayPayload)
          .select();
        savedData.stays = stays || [];
        if (staysError) console.error("Error saving stays:", staysError);
      }
    }

    // 5) Transport options (intercity routes + local alternatives)
    const transportPayload: any[] = [];
    if (Array.isArray(travelPlan.transportation?.routes)) {
      travelPlan.transportation.routes.forEach((route: any) => {
        if (Array.isArray(route.options)) {
          route.options.forEach((opt: any) => {
            transportPayload.push({
              id: crypto.randomUUID(),
              tripId: planRequest.tripId,
              mode: (opt.mode || "TRANSPORT").toUpperCase(),
              scope: "INTERCITY",
              fromCity: route.from || null,
              toCity: route.to || null,
              cost: opt.cost ?? null,
              currency: opt.currency || planRequest.currency || "INR",
              duration: opt.duration || null,
              tips: opt.tips || null,
              selected: false,
            });
          });
        }
      });
    }
    if (Array.isArray(travelPlan.transportation?.localTransportOptions)) {
      travelPlan.transportation.localTransportOptions.forEach((opt: any) => {
        transportPayload.push({
          id: crypto.randomUUID(),
          tripId: planRequest.tripId,
          mode: (opt.mode || "LOCAL").toUpperCase(),
          scope: "LOCAL",
          fromCity: opt.city || null,
          toCity: null,
          cost: opt.cost ?? null,
          currency: opt.currency || planRequest.currency || "INR",
          duration: opt.duration || null,
          tips: opt.tips || null,
          selected: false,
        });
      });
    }
    if (transportPayload.length) {
      const { data: transport, error: transportError } = await supabase
        .from("TransportOption")
        .insert(transportPayload)
        .select();
      savedData.transportOptions = transport || [];
      if (transportError) console.error("Error saving transport options:", transportError);
    }

    // NOTE: no auto expense estimates — expenses come only from user picks.

    // Return the generated plan and saved DB records
    return new Response(
      JSON.stringify({
        success: true,
        tripId: planRequest.tripId,
        plan: travelPlan,
        saved: savedData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-trip-plan:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error?.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});