// src/pages/PublicTrip.tsx
// Read-only public trip view, reached via /t/:publicId share links.
// Renders the PLAN only — no costs, no payer info, no member data
// (the public-trip edge function strips money server-side).

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  BedDouble,
  BusFront,
  ArrowRight,
  List,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";

type PublicTripData = {
  trip: {
    title: string;
    startDate: string;
    endDate: string;
    currency: string;
    totalTravelers: number | null;
    visibility: string;
  };
  cityStops: {
    id: string;
    name: string;
    arrival: string;
    departure: string;
    order: number;
    notes: string | null;
  }[];
  itinerary: {
    id: string;
    title: string;
    day: string;
    kind: string;
    startTime: string | null;
    endTime: string | null;
    notes: string | null;
  }[];
  stays: {
    id: string;
    name: string;
    type: string;
    tier: string;
    cityStopId: string | null;
    location: string | null;
    nights: number;
  }[];
  transport: {
    id: string;
    mode: string;
    scope: string;
    fromCity: string | null;
    toCity: string | null;
    duration: string | null;
    tips: string | null;
  }[];
};

const kindColors: Record<string, string> = {
  STAY: "bg-primary/10 text-primary",
  FOOD: "bg-coral/10 text-coral",
  MOVE: "bg-mustard/10 text-mustard",
  SIGHT: "bg-success/10 text-success",
  ACTIVITY: "bg-success/10 text-success",
  REST: "bg-muted text-muted-foreground",
};

const PublicTrip = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [data, setData] = useState<PublicTripData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!publicId) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-trip?publicId=${encodeURIComponent(publicId)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (cancelled) return;
        if (!res.ok) {
          setState("notfound");
          return;
        }
        setData(await res.json());
        setState("ok");
      } catch {
        if (!cancelled) setState("notfound");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner fullscreen text="Loading shared trip..." />
      </div>
    );
  }

  if (state === "notfound" || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <Globe className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
          <p className="text-base font-semibold">This link isn't shared</p>
          <p className="text-sm text-muted-foreground">
            The trip doesn't exist or the owner turned link sharing off.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm">
              Go to NomadX
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { trip, cityStops, itinerary, stays, transport } = data;
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;

  // Days between start and end, itinerary grouped by its day field.
  const days: string[] = [];
  for (let i = 0; i < duration; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(format(d, "yyyy-MM-dd"));
  }
  const byDay = new Map<string, typeof itinerary>();
  itinerary.forEach((item) => {
    const key = (item.day || "").slice(0, 10);
    if (!key) return;
    const arr = byDay.get(key) || [];
    arr.push(item);
    byDay.set(key, arr);
  });

  const cityName = (cityStopId: string | null) =>
    cityStops.find((c) => c.id === cityStopId)?.name || "Somewhere nice";

  const intercityLegs = new Map<string, typeof transport>();
  transport
    .filter((o) => o.scope === "INTERCITY")
    .forEach((o) => {
      const key = `${o.fromCity || "?"}|${o.toCity || "?"}`;
      const arr = intercityLegs.get(key) || [];
      arr.push(o);
      intercityLegs.set(key, arr);
    });

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 sm:pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            Shared itinerary — read only
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-gradient-hero break-words">
            {trip.title}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(startDate, "MMM d, yyyy")} – {format(endDate, "MMM d, yyyy")} ({duration} days)
            </span>
            {(trip.totalTravelers || 1) > 1 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {trip.totalTravelers} travelers
              </span>
            )}
          </div>
          {cityStops.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {cityStops.map((c, i) => (
                <span key={c.id} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  <Badge variant="secondary" className="text-[10px]">
                    {c.name}
                  </Badge>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Route */}
        {intercityLegs.size > 0 && (
          <Card className="border-0 bg-card mb-6">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <BusFront className="w-4 h-4 text-mustard" />
                How they're getting around
              </h2>
              <div className="space-y-2">
                {Array.from(intercityLegs.entries()).map(([key, opts]) => {
                  const [from, to] = key.split("|");
                  return (
                    <div
                      key={key}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-xs sm:text-sm"
                    >
                      <span className="font-medium">
                        {from} <ArrowRight className="inline w-3 h-3" /> {to}
                      </span>
                      {opts.map((o) => (
                        <Badge
                          key={o.id}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {o.mode.replace(/_/g, " ").toLowerCase()}
                          {o.duration ? ` · ${o.duration}` : ""}
                        </Badge>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day by day */}
        <Card className="border-0 bg-card mb-6">
          <CardContent className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <List className="w-4 h-4 text-primary" />
              Day by day
            </h2>
            <div className="space-y-5">
              {days.map((day) => {
                const items = byDay.get(day) || [];
                return (
                  <div key={day}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {format(new Date(day + "T12:00:00"), "EEEE, MMM d")}
                    </p>
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nothing planned yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2.5 rounded-lg bg-muted/30 px-3 py-2"
                          >
                            <Badge
                              variant="outline"
                              className={`text-[10px] flex-shrink-0 ${
                                kindColors[item.kind] || "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.kind}
                            </Badge>
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug">
                                {item.title}
                              </p>
                              {(item.startTime || item.notes) && (
                                <p className="text-xs text-muted-foreground">
                                  {item.startTime
                                    ? item.startTime.slice(0, 5)
                                    : ""}
                                  {item.startTime && item.notes ? " · " : ""}
                                  {item.notes || ""}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stays */}
        {stays.length > 0 && (
          <Card className="border-0 bg-card">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <BedDouble className="w-4 h-4 text-primary" />
                Where they're staying
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {stays
                  .filter((s) => s.nights > 0)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg bg-muted/30 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium leading-snug">{s.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {s.location || cityName(s.cityStopId)}
                        {s.nights > 0 ? ` · ${s.nights}N` : ""}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PublicTrip;
