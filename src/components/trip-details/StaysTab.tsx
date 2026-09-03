import { useMemo } from "react";
import {
  BedDouble,
  MapPin,
  Check,
  IndianRupee,
  ExternalLink,
  Minus,
  Plus,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import {
  googleMapsUrl,
  bookingUrl,
  type Stay,
  type CityStopInfo,
} from "@/services/stays-transport.service";

interface StaysTabProps {
  stays: Stay[];
  cityStops: CityStopInfo[];
  tripNights: number;
  onSetNights: (stay: Stay, nights: number) => void;
  isSetting: boolean;
}

const tierConfig: Record<string, { label: string; className: string }> = {
  BUDGET: { label: "Budget", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  MIDRANGE: { label: "Mid-range", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  UNIQUE: { label: "Unique stay", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
};

const StaysTab = ({ stays, cityStops, tripNights, onSetNights, isSetting }: StaysTabProps) => {
  // nights available per city, from the CityStop dates (fall back to trip nights)
  const cityNights = useMemo(() => {
    const map: Record<string, number> = {};
    cityStops.forEach((cs) => {
      try {
        const n = differenceInDays(new Date(cs.departure), new Date(cs.arrival));
        map[cs.id] = Math.max(1, n);
      } catch {
        map[cs.id] = tripNights;
      }
    });
    return map;
  }, [cityStops, tripNights]);

  const cityNames = useMemo(() => {
    const map: Record<string, string> = {};
    cityStops.forEach((cs) => (map[cs.id] = cs.name));
    return map;
  }, [cityStops]);

  const grouped = useMemo(() => {
    const map = new Map<string, Stay[]>();
    stays.forEach((s) => {
      const key = s.cityStopId || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries());
  }, [stays]);

  const totalPicked = useMemo(
    () => stays.reduce((sum, s) => sum + (s.nights > 0 ? s.nights : 0), 0),
    [stays]
  );
  const totalStayCost = useMemo(
    () =>
      stays.reduce(
        (sum, s) => sum + (s.nights > 0 ? s.nights * s.costPerNight : 0),
        0
      ),
    [stays]
  );

  if (!stays.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BedDouble className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          No stay options yet. Generate an AI plan for this trip to get hotel, hostel and homestay picks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Assign nights to stays — same city can split across multiple stays. Your budget only counts what you assign.
        </p>
        {totalPicked > 0 && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {totalPicked}/{tripNights} nights &bull; {"\u20B9"}
            {totalStayCost.toLocaleString()}
          </Badge>
        )}
      </div>

      {grouped.map(([cityStopId, options]) => {
        const budget = cityNights[cityStopId] ?? tripNights;
        const used = options.reduce((sum, s) => sum + (s.nights > 0 ? s.nights : 0), 0);
        const remaining = budget - used;
        return (
          <div key={cityStopId} className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {cityNames[cityStopId] || "Your trip"}
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {used}/{budget} nights assigned
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((stay) => {
                const tier = tierConfig[stay.tier] || tierConfig.BUDGET;
                const picked = stay.nights > 0;
                const canAdd = remaining > 0 || picked;
                return (
                  <Card
                    key={stay.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      picked && "ring-2 ring-primary border-primary/50"
                    )}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="secondary" className={cn("text-[10px]", tier.className)}>
                          {tier.label}
                        </Badge>
                        {picked && (
                          <Badge className="text-[10px] bg-primary">
                            <Check className="w-3 h-3 mr-0.5" />
                            {stay.nights}N
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm leading-snug">{stay.name}</p>
                      {stay.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {stay.location}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-primary" />
                        <span className="text-lg font-bold">
                          {stay.costPerNight.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">/night</span>
                        {picked && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            = {"\u20B9"}{(stay.nights * stay.costPerNight).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <a
                          href={googleMapsUrl(stay)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full text-xs h-8">
                            <ExternalLink className="w-3 h-3 mr-1" /> Maps
                          </Button>
                        </a>
                        <a
                          href={bookingUrl(stay)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full text-xs h-8">
                            <BookOpen className="w-3 h-3 mr-1" /> Book
                          </Button>
                        </a>
                      </div>

                      <div className="flex items-center justify-between rounded-md border p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={isSetting || !picked}
                          onClick={() => onSetNights(stay, stay.nights - 1)}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {picked ? `${stay.nights} night${stay.nights > 1 ? "s" : ""}` : "not picked"}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={isSetting || (!canAdd && !picked)}
                          onClick={() => onSetNights(stay, Math.min(stay.nights + 1, budget))}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StaysTab;
