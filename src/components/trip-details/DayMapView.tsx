// src/components/trip-details/DayMapView.tsx
// Phase 4: day-by-day map view. One route map per day with numbered stops
// in plan order, a connecting polyline, and a Google Maps directions link
// for each day (mirrors Google Maps' multi-stop day planner).

import { useMemo } from "react";
import { format } from "date-fns";
import { MapPin, ExternalLink } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

type ItineraryItem = Tables<"ItineraryItem">;
type Poi = Tables<"Poi">;

interface DayMapViewProps {
  tripId: string;
  itinerary: ItineraryItem[];
  pois: Poi[];
}

const numberedIcon = (n: number) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:#e2504a;color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
      border:2px solid #fff;
    ">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const DayMapView: React.FC<DayMapViewProps> = ({ itinerary, pois }) => {
  const poiById = useMemo(() => {
    const m = new Map<string, Poi>();
    pois.forEach((p) => m.set(p.id, p));
    return m;
  }, [pois]);

  // Group itinerary items by their day, in plan order, keeping only items
  // that map to a POI with usable coordinates.
  const dayMaps = useMemo(() => {
    const byDay = new Map<string, ItineraryItem[]>();
    itinerary.forEach((item) => {
      const key = (item.day || "").slice(0, 10);
      if (!key) return;
      const arr = byDay.get(key) || [];
      arr.push(item);
      byDay.set(key, arr);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, items]) => ({
        day,
        stops: items
          .map((item) => {
            const poi = item.poiId ? poiById.get(item.poiId) : undefined;
            return poi &&
              poi.lat &&
              poi.lng &&
              poi.lat !== 0 &&
              poi.lng !== 0
              ? { item, poi }
              : null;
          })
          .filter((s): s is { item: ItineraryItem; poi: Poi } => s !== null),
      }))
      .filter((d) => d.stops.length > 0);
  }, [itinerary, poiById]);

  if (dayMaps.length === 0) {
    return (
      <Card className="border-0 bg-card">
        <CardContent className="p-6 text-center">
          <MapPin className="w-8 h-8 mx-auto text-muted-foreground opacity-40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No mapped stops yet. Link itinerary items to places to see each
            day's route on a map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {dayMaps.map(({ day, stops }) => {
        const center: [number, number] = [
          stops.reduce((s, x) => s + (x.poi.lat || 0), 0) / stops.length,
          stops.reduce((s, x) => s + (x.poi.lng || 0), 0) / stops.length,
        ];
        const gmapsLink = `https://www.google.com/maps/dir/${stops
          .map((s) => `${s.poi.lat},${s.poi.lng}`)
          .join("/")}`;
        const bounds = L.latLngBounds(
          stops.map((s) => [s.poi.lat as number, s.poi.lng as number] as [number, number])
        );

        return (
          <Card key={day} className="border-0 bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">
                  {format(new Date(day + "T12:00:00"), "EEEE, MMM d")}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {stops.length} stop{stops.length > 1 ? "s" : ""}
                  </span>
                </p>
                <a
                  href={gmapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Google Maps
                </a>
              </div>
              <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                className="h-56 sm:h-64 w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds bounds={bounds} />
                <Polyline
                  positions={stops.map(
                    (s) => [s.poi.lat as number, s.poi.lng as number] as [number, number]
                  )}
                  pathOptions={{ color: "#e2504a", weight: 3, opacity: 0.7 }}
                />
                {stops.map(({ item, poi }, i) => (
                  <Marker
                    key={item.id}
                    position={[poi.lat as number, poi.lng as number]}
                    icon={numberedIcon(i + 1)}
                  >
                    <Popup>
                      <strong>{i + 1}. {item.title}</strong>
                      <br />
                      {poi.name}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3">
                {stops.map(({ item }, i) => (
                  <span
                    key={item.id}
                    className="text-xs text-muted-foreground flex items-center gap-1.5"
                  >
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-coral/10 text-coral font-bold text-[10px]">
                      {i + 1}
                    </span>
                    {item.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Keeps each day's markers visible without manual zoom fiddling.
const FitBounds: React.FC<{ bounds: L.LatLngBounds }> = ({ bounds }) => {
  const fit = (map: L.Map) => {
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  };
  return <FitBoundsInner fit={fit} />;
};

const FitBoundsInner: React.FC<{ fit: (map: L.Map) => void }> = ({ fit }) => {
  const map = useMap();
  useMemo(() => fit(map), [map, fit]);
  return null;
};

export default DayMapView;
