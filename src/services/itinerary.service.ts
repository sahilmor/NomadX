import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type CityStop = Tables<'CityStop'>;
type CityStopInsert = TablesInsert<'CityStop'>;
type Poi = Tables<'Poi'>;
type PoiInsert = TablesInsert<'Poi'>;
type ItineraryItem = Tables<'ItineraryItem'>;
type ItineraryItemInsert = TablesInsert<'ItineraryItem'>;
type ItineraryItemUpdate = TablesUpdate<'ItineraryItem'>;

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

export const useTripItinerary = (tripId: string) => {
  return useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async () => {
      const { data, error } = await getTripItinerary(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};

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

export const useTripPOIs = (tripId: string) => {
  return useQuery({
    queryKey: ['pois', tripId],
    queryFn: async () => {
      const { data, error } = await getTripPOIs(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};

export const createItineraryItem = async (item: ItineraryItemInsert) => {
  // Ensure we always send an id (like saveItineraryItems does)
  const { id: _ignored, ...rest } = item;

  const insertPayload = {
    id: crypto.randomUUID(),
    ...rest,
  };

  const { data, error } = await supabase
    .from("ItineraryItem")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error creating itinerary item:", error);
    throw error;
  }

  return data as ItineraryItem;
};

export const useCreateItineraryItem = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItineraryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
    },
  });
};

export const updateItineraryItem = async ({
  id,
  updates,
}: {
  id: string;
  updates: ItineraryItemUpdate;
}) => {
  const { data, error } = await supabase
    .from("ItineraryItem")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating itinerary item:", error);
    throw error;
  }

  return data as ItineraryItem;
};

export const deleteItineraryItem = async (id: string) => {
  const { error } = await supabase
    .from("ItineraryItem")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting itinerary item:", error);
    throw error;
  }

  return { success: true };
};

export const useUpdateItineraryItem = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateItineraryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
};



export const useDeleteItineraryItem = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItineraryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    },
  });
};

export const createPoi = async (poi: PoiInsert) => {
  // Remove any `id` coming from the caller to avoid overwriting
  const { id: _ignored, ...rest } = poi;

  const payload: PoiInsert = {
    id: crypto.randomUUID(),
    ...rest,
  };

  const { data, error } = await supabase
    .from("Poi")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating POI:", error);
    throw error; // IMPORTANT: let React Query see the error
  }

  return data as Poi;
};

export const useCreatePoi = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois', tripId] });
    },
  });
};

export const deletePoi = async (id: string) => {
  try {
    const { error } = await supabase
      .from('Poi')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting POI:', error);
    return { error };
  }
};

export const useDeletePoi = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pois', tripId] });
    },
  });
};