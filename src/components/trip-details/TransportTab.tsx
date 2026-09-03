import { useMemo } from "react";
import {
  BusFront,
  Bike,
  TrainFront,
  Car,
  Plane,
  Footprints,
  IndianRupee,
  Check,
  Lightbulb,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransportOption } from "@/services/stays-transport.service";

interface TransportTabProps {
  options: TransportOption[];
  travelers?: number;
  onToggle: (option: TransportOption, picked: boolean) => void;
  isToggling: boolean;
}

const modeIcons: Record<string, typeof BusFront> = {
  FLIGHT: Plane,
  TRAIN: TrainFront,
  BUS: BusFront,
  FERRY: BusFront,
  BIKE_RENTAL: Bike,
  SCOOTY_RENTAL: Bike,
  BIKE: Bike,
  CAB: Car,
  TAXI: Car,
  AUTO_RICKSHAW: Car,
  METRO: TrainFront,
  WALK: Footprints,
};

const modeLabels: Record<string, string> = {
  BIKE_RENTAL: "Bike rental",
  SCOOTY_RENTAL: "Scooty rental",
  AUTO_RICKSHAW: "Auto rickshaw",
};

const TransportTab = ({ options, travelers = 1, onToggle, isToggling }: TransportTabProps) => {
  const intercityLegs = useMemo(() => {
    const map = new Map<string, TransportOption[]>();
    options
      .filter((o) => o.scope === "INTERCITY")
      .forEach((o) => {
        const key = `${o.fromCity || "?"}|${o.toCity || "?"}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(o);
      });
    return Array.from(map.entries());
  }, [options]);

  const localByCity = useMemo(() => {
    const map = new Map<string, TransportOption[]>();
    options
      .filter((o) => o.scope === "LOCAL")
      .forEach((o) => {
        const key = o.fromCity || "Local";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(o);
      });
    return Array.from(map.entries());
  }, [options]);

  const picked = useMemo(() => options.filter((o) => o.selected), [options]);
  const pickedTotal = useMemo(
    () =>
      picked.reduce(
        (sum, o) => sum + (o.cost || 0) * (o.isPerPerson ? travelers : 1),
        0
      ),
    [picked, travelers]
  );

  if (!options.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BusFront className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          No transport options yet. Generate an AI plan to compare flights, trains, bike rentals, cabs and more.
        </p>
      </div>
    );
  }

  const renderOption = (opt: TransportOption) => {
    const Icon = modeIcons[opt.mode] || BusFront;
    const label = modeLabels[opt.mode] || opt.mode.replace(/_/g, " ").toLowerCase();
    return (
      <Card
        key={opt.id}
        className={cn("transition-all hover:shadow-md", opt.selected && "ring-2 ring-primary border-primary/50")}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm capitalize">{label}</span>
            </div>
            {opt.selected && (
              <Badge className="text-[10px] bg-primary">
                <Check className="w-3 h-3 mr-0.5" /> Picked
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {opt.cost != null ? (
                <span className="text-sm font-bold flex items-center">
                  <IndianRupee className="w-3.5 h-3.5 text-primary" />
                  {opt.cost.toLocaleString()}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Varies</span>
              )}
              {opt.cost != null && (
                <span className="text-xs text-muted-foreground">
                  {opt.isPerPerson
                    ? travelers > 1
                      ? `per person \u00b7 \u20b9${(opt.cost * travelers).toLocaleString()} total`
                      : "per person"
                    : "for the group"}
                </span>
              )}
              {opt.duration && (
                <span className="text-xs text-muted-foreground">&bull; {opt.duration}</span>
              )}
            </div>
            <Button
              size="sm"
              variant={opt.selected ? "outline" : "default"}
              disabled={isToggling}
              onClick={() => onToggle(opt, !opt.selected)}
            >
              {opt.selected ? "Unpick" : "Pick"}
            </Button>
          </div>

          {opt.tips && (
            <p className="text-xs text-muted-foreground flex gap-1.5 pt-1 border-t">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
              {opt.tips}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pick how you travel, leg by leg — mix and match as many options as you want. Each pick lands in your budget.
        </p>
        {picked.length > 0 && (
          <Badge variant="secondary" className="whitespace-nowrap">
            {picked.length} picked &bull; {"\u20B9"}
            {pickedTotal.toLocaleString()}
          </Badge>
        )}
      </div>

      {intercityLegs.map(([key, opts]) => {
        const [from, to] = key.split("|");
        return (
          <div key={key} className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              {from} <ArrowRight className="w-4 h-4 text-primary" /> {to}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {opts.map(renderOption)}
            </div>
          </div>
        );
      })}

      {localByCity.map(([city, opts]) => (
        <div key={city} className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            Roaming around {city}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opts.map(renderOption)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransportTab;
