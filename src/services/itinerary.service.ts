import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

type CityStop = Tables<'CityStop'>;
type CityStopInsert = TablesInsert<'CityStop'>;
type Poi = Tables<'Poi'>;
type PoiInsert = TablesInsert<'Poi'>;
type ItineraryItem = Tables<'ItineraryItem'>;
type ItineraryItemInsert = TablesInsert<'ItineraryItem'>;

// Save city stops from AI plan
export const saveCityStops = async (tripId: string, cityStops: Array<{
  name: string;
  lat: number;
  lng: number;
  arrival: string;
  departure: string;
  order: number;
  notes?: string;
}>) => {
  try {
    const stops: CityStopInsert[] = cityStops.map((stop, index) => ({
      id: crypto.randomUUID(),
      tripId,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      arrival: stop.arrival,
      departure: stop.departure,
      order: stop.order !== undefined ? stop.order : index,
      notes: stop.notes || null,
    }));

    const { data, error } = await supabase
      .from('CityStop')
      .insert(stops)
      .select();

    if (error) {
      console.error('Error saving city stops:', error);
      return { data: null, error };
    }

    return { data: data as CityStop[], error: null };
  } catch (error: any) {
    console.error('Error in saveCityStops:', error);
    return { data: null, error };
  }
};

// Save POIs (Points of Interest) from AI plan
export const savePOIs = async (tripId: string, pois: Array<{
  name: string;
  lat: number;
  lng: number;
  cityStopId?: string;
  tags?: string[];
  photoUrl?: string;
  websiteUrl?: string;
  rating?: number;
  priceLevel?: number;
}>) => {
  try {
    const poiInserts: PoiInsert[] = pois.map((poi) => ({
      id: crypto.randomUUID(),
      tripId,
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      cityStopId: poi.cityStopId || null,
      tags: poi.tags || null,
      photoUrl: poi.photoUrl || null,
      websiteUrl: poi.websiteUrl || null,
      rating: poi.rating || null,
      priceLevel: poi.priceLevel || null,
      externalId: null,
    }));

    const { data, error } = await supabase
      .from('Poi')
      .insert(poiInserts)
      .select();

    if (error) {
      console.error('Error saving POIs:', error);
      return { data: null, error };
    }

    return { data: data as Poi[], error: null };
  } catch (error: any) {
    console.error('Error in savePOIs:', error);
    return { data: null, error };
  }
};

// Save itinerary items from AI plan
export const saveItineraryItems = async (tripId: string, items: Array<{
  day: string;
  title: string;
  kind: 'MOVE' | 'STAY' | 'FOOD' | 'SIGHT' | 'ACTIVITY' | 'REST';
  startTime?: string;
  endTime?: string;
  cost?: number;
  notes?: string;
  poiId?: string;
}>) => {
  try {
    const itemInserts: ItineraryItemInsert[] = items.map((item) => ({
      id: crypto.randomUUID(),
      tripId,
      day: item.day,
      title: item.title,
      kind: item.kind,
      startTime: item.startTime || null,
      endTime: item.endTime || null,
      cost: item.cost || null,
      notes: item.notes || null,
      poiId: item.poiId || null,
    }));

    const { data, error } = await supabase
      .from('ItineraryItem')
      .insert(itemInserts)
      .select();

    if (error) {
      console.error('Error saving itinerary items:', error);
      return { data: null, error };
    }

    return { data: data as ItineraryItem[], error: null };
  } catch (error: any) {
    console.error('Error in saveItineraryItems:', error);
    return { data: null, error };
  }
};

// Get itinerary for a trip
export const getTripItinerary = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('ItineraryItem')
      .select('*')
      .eq('tripId', tripId)
      .order('day', { ascending: true })
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error fetching itinerary:', error);
      return { data: null, error };
    }

    return { data: data as ItineraryItem[], error: null };
  } catch (error: any) {
    console.error('Error in getTripItinerary:', error);
    return { data: null, error };
  }
};

// --- NEW: React Query hook for getTripItinerary ---
export const useTripItinerary = (tripId: string) => {
  return useQuery({
    queryKey: ['tripItinerary', tripId],
    queryFn: async () => {
      const { data, error } = await getTripItinerary(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};


// Get city stops for a trip
export const getTripCityStops = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('CityStop')
      .select('*')
      .eq('tripId', tripId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching city stops:', error);
      return { data: null, error };
    }

    return { data: data as CityStop[], error: null };
  } catch (error: any) {
    console.error('Error in getTripCityStops:', error);
    return { data: null, error };
  }
};

// Get POIs for a trip
export const getTripPOIs = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('Poi')
      .select('*')
      .eq('tripId', tripId);

    if (error) {
      console.error('Error fetching POIs:', error);
      return { data: null, error };
    }

    return { data: data as Poi[], error: null };
  } catch (error: any) {
    console.error('Error in getTripPOIs:', error);
    return { data: null, error };
  }
};

// --- NEW: React Query hook for getTripPOIs ---
export const useTripPOIs = (tripId: string) => {
  return useQuery({
    queryKey: ['tripPOIs', tripId],
    queryFn: async () => {
      const { data, error } = await getTripPOIs(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};