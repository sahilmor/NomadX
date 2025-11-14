import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Tables } from "@/integrations/supabase/types";

// --- Leaflet Icon Fix (Global) ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
// --- End Fix ---

type Poi = Tables<'Poi'>;
interface TripMapProps {
  pois: Poi[] | undefined;
}

export const TripMap: React.FC<TripMapProps> = ({ pois }) => {
  const validPOIs = useMemo(() => {
    return pois?.filter(poi => poi.lat && poi.lng && poi.lat !== 0 && poi.lng !== 0) || [];
  }, [pois]);

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
          scrollWheelZoom={true} 
          className="h-[500px] w-full rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validPOIs.map(poi => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]}>
              <Popup>
                <b>{poi.name}</b>
                {poi.tags && <br />}
                {poi.tags?.join(', ')}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};