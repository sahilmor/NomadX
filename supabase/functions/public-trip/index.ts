// Public read-only trip access by share link (Phase 3).
// Anyone with the link can fetch a trip's PLAN (cities, itinerary, stays,
// transport). Money never leaves the server: costs, budgets and payer ids
// are stripped here so they cannot be recovered from the response.

// @ts-ignore - Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(500, { error: "Server configuration error" });
  }

  const publicId = new URL(req.url).searchParams.get("publicId")?.trim();
  if (!publicId || publicId.length > 64) {
    return json(400, { error: "Missing or invalid publicId" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: trip, error: tripError } = await supabase
    .from("Trip")
    .select(
      "id, title, startDate, endDate, currency, visibility, publicId, totalTravelers"
    )
    .eq("publicId", publicId)
    .in("visibility", ["LINK", "PUBLIC"])
    .maybeSingle();

  if (tripError) {
    console.error("public-trip trip query error:", tripError);
    return json(500, { error: "Lookup failed" });
  }
  if (!trip) {
    // Same response for unknown id and revoked link — do not leak existence.
    return json(404, { error: "Trip not found or link revoked" });
  }

  const [cityStops, itinerary, pois, stays, transport] = await Promise.all([
    supabase
      .from("CityStop")
      .select("id, name, arrival, departure, order, notes")
      .eq("tripId", trip.id)
      .order("order"),
    supabase
      .from("ItineraryItem")
      .select("id, title, day, kind, startTime, endTime, poiId, notes")
      .eq("tripId", trip.id)
      .order("day"),
    supabase
      .from("Poi")
      .select("id, name, lat, lng, city, style, category, description")
      .eq("tripId", trip.id),
    supabase
      .from("Stay")
      .select("id, name, type, tier, cityStopId, location, nights, isPerPerson")
      .eq("tripId", trip.id),
    supabase
      .from("TransportOption")
      .select("id, mode, scope, fromCity, toCity, duration, tips, isPerPerson")
      .eq("tripId", trip.id),
  ]);

  // Costs and payer identities are intentionally omitted from every payload.
  return json(200, {
    trip: {
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      currency: trip.currency,
      totalTravelers: trip.totalTravelers,
      visibility: trip.visibility,
    },
    cityStops: cityStops.data || [],
    itinerary: itinerary.data || [],
    pois: pois.data || [],
    stays: stays.data || [],
    transport: transport.data || [],
  });
});
