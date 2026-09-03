// src/pages/PrintSummary.tsx
// Phase 7: PDF export via the browser's print-to-PDF. Clean document
// layout (TripIt-style), screen chrome hidden by print CSS.

import { useParams, Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { useTrip } from "@/services/trip.service";
import { useTripItinerary, useTripPOIs } from "@/services/itinerary.service";
import {
  useTripStays,
  useTripTransport,
  useTripCityStops,
} from "@/services/stays-transport.service";
import { useTripExpenses } from "@/services/expense.service";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";

const CATEGORY_LABELS: Record<string, string> = {
  STAY: "Stay",
  FOOD: "Food",
  TRANSPORT: "Transport",
  ENTERTAINMENT: "Activities",
  SHOPPING: "Shopping",
  MISC: "Other",
};

const PrintSummary = () => {
  const { tripId } = useParams<{ tripId: string }>();

  const { data: trip, isLoading: t } = useTrip(tripId!) as {
    data: any;
    isLoading: boolean;
  };
  const { data: itinerary, isLoading: i1 } = useTripItinerary(tripId!);
  const { data: pois } = useTripPOIs(tripId!);
  const { data: stays } = useTripStays(tripId!);
  const { data: transport } = useTripTransport(tripId!);
  const { data: cityStops } = useTripCityStops(tripId!);
  const { data: expenses } = useTripExpenses(tripId!);

  const isLoading = t || i1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner fullscreen text="Preparing printable itinerary..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Trip not found.</p>
      </div>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const duration = differenceInDays(endDate, startDate) + 1;

  const byDay = new Map<string, typeof itinerary>();
  (itinerary || []).forEach((item: any) => {
    const key = (item.day || "").slice(0, 10);
    if (!key) return;
    const arr = byDay.get(key) || [];
    arr.push(item);
    byDay.set(key, arr);
  });
  const days: string[] = [];
  for (let i = 0; i < duration; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(format(d, "yyyy-MM-dd"));
  }

  const pickedStays = (stays || []).filter((s: any) => s.nights > 0);
  const pickedTransport = (transport || []).filter(
    (o: any) => o.cost != null || o.scope === "INTERCITY"
  );
  const legOptions = pickedTransport.filter((o: any) => o.scope === "INTERCITY");

  const realExpenses = (expenses || []).filter(
    (e: any) => e.cost != null && !(e.notes || "").startsWith("Split anchor")
  );
  const categoryTotals = new Map<string, number>();
  let total = 0;
  realExpenses.forEach((e: any) => {
    const amt =
      Number(e.cost) * (e.isPerPerson ? Number(trip.totalTravelers || 1) : 1);
    const cat = CATEGORY_LABELS[e.category] || "Other";
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + amt);
    total += amt;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only toolbar */}
      <div className="print-hide fixed top-0 inset-x-0 z-10 bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
        <Link
          to={`/my-trips/${tripId}`}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to trip
        </Link>
        <Button size="sm" className="btn-coral" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Document */}
      <main className="print-view pt-16 sm:pt-16 max-w-3xl mx-auto px-6 sm:px-8 py-8 text-foreground bg-background">
        <header className="mb-6 pb-4 border-b-2 border-foreground/80">
          <h1 className="text-3xl font-black">{trip.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(startDate, "EEEE, MMM d, yyyy")} –{" "}
            {format(endDate, "EEEE, MMM d, yyyy")} ({duration} days)
            {trip.totalTravelers ? ` · ${trip.totalTravelers} travelers` : ""}
          </p>
          {cityStops && cityStops.length > 0 && (
            <p className="text-sm mt-1">
              <span className="font-semibold">Route: </span>
              {cityStops.map((c: any) => c.name).join(" → ")}
            </p>
          )}
        </header>

        {/* Day by day */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Itinerary</h2>
          <div className="space-y-4">
            {days.map((day) => {
              const items = byDay.get(day) || [];
              return (
                <div key={day} className="break-inside-avoid">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-1.5">
                    {format(new Date(day + "T12:00:00"), "EEEE, MMM d")}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : (
                    <ul className="space-y-1">
                      {items.map((item: any) => {
                        const poi = item.poiId
                          ? (pois || []).find((p: any) => p.id === item.poiId)
                          : null;
                        return (
                          <li key={item.id} className="text-sm leading-snug">
                            {item.startTime && (
                              <span className="inline-block w-14 font-medium text-muted-foreground">
                                {item.startTime.slice(0, 5)}
                              </span>
                            )}
                            <span className="font-medium">{item.title}</span>
                            {item.notes && (
                              <span className="text-muted-foreground">
                                {" "}
                                — {item.notes}
                              </span>
                            )}
                            {poi && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({poi.name})
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Transport */}
        {legOptions.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="text-lg font-bold mb-3">Travel between cities</h2>
            <ul className="space-y-1">
              {legOptions.map((o: any, idx: number) => (
                <li key={`${o.id}-${idx}`} className="text-sm">
                  <span className="font-medium">
                    {o.fromCity} → {o.toCity}:
                  </span>{" "}
                  {String(o.mode).toLowerCase().replace(/_/g, " ")}
                  {o.duration ? ` · ${o.duration}` : ""}
                  {o.tips ? ` · ${o.tips}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Stays */}
        {pickedStays.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <h2 className="text-lg font-bold mb-3">Stays</h2>
            <ul className="space-y-1">
              {pickedStays.map((s: any) => (
                <li key={s.id} className="text-sm">
                  <span className="font-medium">{s.name}</span>
                  {s.location ? ` — ${s.location}` : ""}
                  {s.nights ? ` (${s.nights} night${s.nights > 1 ? "s" : ""})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Budget */}
        {realExpenses.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="text-lg font-bold mb-3">Budget summary</h2>
            <table className="w-full text-sm">
              <tbody>
                {Array.from(categoryTotals.entries()).map(([cat, amt]) => (
                  <tr key={cat} className="border-b border-border/60">
                    <td className="py-1">{cat}</td>
                    <td className="py-1 text-right font-medium">
                      {trip.currency} {amt.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 font-bold">Total</td>
                  <td className="py-1.5 text-right font-bold">
                    {trip.currency} {total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-10 pt-3 border-t border-border text-[10px] text-muted-foreground">
          Planned with NomadX · {format(new Date(), "PPP")}
        </footer>
      </main>
    </div>
  );
};

export default PrintSummary;
