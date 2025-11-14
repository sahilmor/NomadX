// src/components/trip-details/PoisTab.tsx

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Landmark, MapPin, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCreatePoi, useDeletePoi } from "@/services/itinerary.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Leaflet icon config (once in this module)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type Poi = Tables<"Poi">;

interface TripMapProps {
  pois: Poi[];
  onMapClick?: (latlng: L.LatLng) => void;
}

const MapClickHandler: React.FC<{ onMapClick?: (latlng: L.LatLng) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng);
    },
  });
  return null;
};

const TripMap: React.FC<TripMapProps> = ({ pois, onMapClick }) => {
  const validPOIs = useMemo(
    () =>
      pois.filter(
        (poi) => poi.lat && poi.lng && poi.lat !== 0 && poi.lng !== 0
      ),
    [pois]
  );

  const mapCenter: L.LatLngExpression =
    validPOIs.length > 0
      ? [validPOIs[0].lat, validPOIs[0].lng]
      : [51.505, -0.09];

  return (
    <Card className="border-0 bg-card">
      <CardContent className="p-0">
        <MapContainer
          center={mapCenter}
          zoom={10}
          scrollWheelZoom
          className="h-[500px] w-full rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* handle clicks */}
          <MapClickHandler onMapClick={onMapClick} />

          {validPOIs.map((poi) => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]}>
              <Popup>
                <b>{poi.name}</b>
                {poi.tags && <br />}
                {poi.tags?.join(", ")}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

const PoiCardActions: React.FC<{ poi: Poi; tripId: string }> = ({
  poi,
  tripId,
}) => {
  const { toast } = useToast();
  const deletePoiMutation = useDeletePoi(tripId);

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete ${poi.name}?`)) return;

    deletePoiMutation.mutate(poi.id, {
      onSuccess: () => {
        toast({
          title: "POI Deleted",
          description: `${poi.name} has been removed.`,
        });
      },
      onError: (e) => {
        toast({
          title: "Error",
          description: `Failed to delete POI: ${e.message}`,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={deletePoiMutation.isPending}
    >
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  );
};

// ---- POI CREATE DIALOG ----

// inside the same file, or in a separate file if you extracted it

interface PoiDialogProps {
  tripId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat: number | null;
  initialLng: number | null;
}

const PoiDialog: React.FC<PoiDialogProps> = ({
  tripId,
  isOpen,
  onOpenChange,
  initialLat,
  initialLng,
}) => {
  const { toast } = useToast();
  const createPoiMutation = useCreatePoi(tripId);

  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [tags, setTags] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("");
  const [priceLevel, setPriceLevel] = useState("");

  const isPending = createPoiMutation.isPending;

  // When dialog opens, if we have initial coords from map click, use them
  useEffect(() => {
    if (isOpen) {
      if (initialLat != null && initialLng != null) {
        setLat(initialLat.toString());
        setLng(initialLng.toString());
      } else {
        setLat("");
        setLng("");
      }
    }
  }, [isOpen, initialLat, initialLng]);

  const resetForm = () => {
    setName("");
    setLat("");
    setLng("");
    setTags("");
    setWebsiteUrl("");
    setNotes("");
    setRating("");
    setPriceLevel("");
  };

  const handleClose = (open: boolean) => {
    if (!open && !isPending) {
      resetForm();
      onOpenChange(false);
    } else {
      onOpenChange(open);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Validation Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!lat || !lng) {
      toast({
        title: "Missing Location",
        description: "Please click on the map to choose a location (or enter coordinates).",
        variant: "destructive",
      });
      return;
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast({
        title: "Validation Error",
        description: "Latitude and longitude must be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      tripId,
      name: name.trim(),
      lat: latNum,
      lng: lngNum,
      cityStopId: null,
      tags:
        tags.trim().length > 0
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : null,
      photoUrl: null,
      websiteUrl: websiteUrl.trim() || null,
      rating: rating ? Number(rating) : null,
      priceLevel: priceLevel ? Number(priceLevel) : null,
      externalId: null,
    };

    createPoiMutation.mutate(payload as TablesInsert<"Poi">, {
      onSuccess: () => {
        toast({
          title: "POI Added",
          description: `${name} has been added to this trip.`,
        });
        resetForm();
        onOpenChange(false);
      },
      onError: (e: any) => {
        toast({
          title: "Error",
          description: `Failed to add POI: ${e.message}`,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Point of Interest</DialogTitle>
          <CardDescription>
            Click on the map to choose the location. Then fill in details.
          </CardDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poi-name">Name</Label>
              <Input
                id="poi-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="E.g. India Gate"
                required
              />
            </div>

            {/* Show coordinates, but you can keep them editable or readOnly */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poi-lat">Latitude</Label>
                <Input
                  id="poi-lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  disabled={isPending}
                  placeholder="Click map to fill"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poi-lng">Longitude</Label>
                <Input
                  id="poi-lng"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  disabled={isPending}
                  placeholder="Click map to fill"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poi-tags">Tags (comma-separated)</Label>
              <Input
                id="poi-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isPending}
                placeholder="monument, heritage, must-see"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poi-website">Website (optional)</Label>
              <Input
                id="poi-website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isPending}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poi-rating">Rating (optional)</Label>
                <Input
                  id="poi-rating"
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  disabled={isPending}
                  placeholder="4.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poi-price">Price Level (optional)</Label>
                <Input
                  id="poi-price"
                  type="number"
                  min={0}
                  max={4}
                  step="1"
                  value={priceLevel}
                  onChange={(e) => setPriceLevel(e.target.value)}
                  disabled={isPending}
                  placeholder="0-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poi-notes">Notes (optional)</Label>
              <Textarea
                id="poi-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                placeholder="Extra info, tips, opening hours, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-hero" disabled={isPending}>
              {isPending ? "Saving..." : "Add POI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---- MAIN TAB ----

interface PoisTabProps {
  tripId: string;
  pois: Poi[];
}

const PoisTab: React.FC<PoisTabProps> = ({ tripId, pois }) => {
  const [isPoiDialogOpen, setIsPoiDialogOpen] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (latlng: L.LatLng) => {
    setDraftLocation({ lat: latlng.lat, lng: latlng.lng });
    setIsPoiDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <TripMap pois={pois} onMapClick={handleMapClick} />

      <Card className="border-0 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Points of Interest</CardTitle>
            <CardDescription>Click on the map to add a POI, or use the button.</CardDescription>
          </div>
          <Button
            size="sm"
            className="btn-hero"
            onClick={() => {
              setDraftLocation(null); // no preselected coords
              setIsPoiDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add POI
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pois && pois.length > 0 ? (
            pois.map((poi) => (
              <Card key={poi.id} className="bg-muted/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    {poi.name}
                  </CardTitle>
                  <PoiCardActions poi={poi} tripId={tripId} />
                </CardHeader>
                <CardContent>
                  {poi.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="mr-1">
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center">
              No points of interest found.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create POI Dialog */}
      <PoiDialog
        tripId={tripId}
        isOpen={isPoiDialogOpen}
        onOpenChange={setIsPoiDialogOpen}
        initialLat={draftLocation?.lat ?? null}
        initialLng={draftLocation?.lng ?? null}
      />
    </div>
  );
};

export default PoisTab;