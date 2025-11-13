import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

type Trip = Tables<'Trip'>;
type TripInsert = TablesInsert<'Trip'>;
type TripUpdate = TablesUpdate<'Trip'>;
type UserProfile = Tables<'User'>;
type TripMember = Tables<'TripMember'>;

// Define a new type for the joined data
export type TripMemberWithUser = TripMember & {
  User: Pick<UserProfile, 'id' | 'name' | 'image'> | null;
};

// Helper function to calculate days between dates
const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Generate comprehensive travel plan with Gemini
export const generateTripPlan = async (
  tripId: string,
  tripData: {
    title: string;
    startDate: string;
    endDate: string;
    budget?: number;
    currency?: string;
    description?: string;
    travelers?: number;
  }
) => {
  try {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error('No active session');
    }

    // Get Supabase URL from the client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mnsqjfwgpmyiepruifwr.supabase.co';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${supabaseUrl}/functions/v1`;
    
    console.log('Calling AI plan generation:', {
      url: `${apiBaseUrl}/generate-trip-plan`,
      tripId,
      tripData
    });
    
    // Call Gemini API endpoint to generate comprehensive plan
    const response = await fetch(`${apiBaseUrl}/generate-trip-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tripId,
        ...tripData,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate travel plan';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      } catch (parseError) {
        const errorText = await response.text();
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('API Error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500)
        });
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error generating trip plan:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { 
      data: null, 
      error: error.message || 'Failed to generate travel plan. Please check console for details.' 
    };
  }
};

// Create trip manually
export const createTrip = async (tripData: TripInsert) => {
  try {
    const { data, error } = await supabase
      .from('Trip')
      .insert(tripData)
      .select()
      .single();

    if (error) {
      console.error('Error creating trip:', error);
      return { data: null, error };
    }

    return { data: data as Trip, error: null };
  } catch (error: any) {
    console.error('Error in createTrip:', error);
    return { data: null, error };
  }
};

// Get user's trips with members count
export const getUserTrips = async (userId: string) => {
  try {
    const { data: trips, error: tripsError } = await supabase
      .from('Trip')
      .select('*')
      .eq('ownerId', userId)
      .order('createdAt', { ascending: false });

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
      return { data: null, error: tripsError };
    }

    // Get members count for each trip
    const tripsWithMembers = await Promise.all(
      (trips || []).map(async (trip) => {
        const { count } = await supabase
          .from('TripMember')
          .select('*', { count: 'exact', head: true })
          .eq('tripId', trip.id);

        return {
          ...trip,
          membersCount: count || 0,
          days: calculateDays(trip.startDate, trip.endDate),
          formattedStartDate: formatDate(trip.startDate),
        };
      })
    );

    return { data: tripsWithMembers as (Trip & { membersCount: number; days: number; formattedStartDate: string })[], error: null };
  } catch (error: any) {
    console.error('Error in getUserTrips:', error);
    return { data: null, error };
  }
};

// Get upcoming trips (trips with startDate in the future)
export const getUpcomingTrips = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: trips, error } = await getUserTrips(userId);
    
    if (error || !trips) {
      return { data: [], error };
    }

    const upcoming = trips.filter(trip => trip.startDate >= today);
    return { data: upcoming, error: null };
  } catch (error: any) {
    console.error('Error in getUpcomingTrips:', error);
    return { data: [], error };
  }
};

// Get trip by ID
export const getTripById = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('Trip')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) {
      console.error('Error fetching trip:', error);
      return { data: null, error };
    }

    return { data: data as Trip, error: null };
  } catch (error: any) {
    console.error('Error in getTripById:', error);
    return { data: null, error };
  }
};

// --- NEW: React Query hook for getTripById ---
export const useTrip = (tripId: string) => {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data, error } = await getTripById(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId, // Only run if tripId is available
  });
};

// Update trip
export const updateTrip = async (tripId: string, updates: TripUpdate) => {
  try {
    const { data, error } = await supabase
      .from('Trip')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) {
      console.error('Error updating trip:', error);
      return { data: null, error };
    }

    return { data: data as Trip, error: null };
  } catch (error: any) {
    console.error('Error in updateTrip:', error);
    return { data: null, error };
  }
};

// Delete trip
export const deleteTrip = async (tripId: string) => {
  try {
    const { error } = await supabase
      .from('Trip')
      .delete()
      .eq('id', tripId);

    if (error) {
      console.error('Error deleting trip:', error);
      return { error };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error in deleteTrip:', error);
    return { error };
  }
};

// Get trip members
export const getTripMembers = async (tripId: string) => {
  try {
    // --- UPDATED: Join with User table to get name and image ---
    const { data, error } = await supabase
      .from('TripMember')
      .select(`
        *,
        User (
          id,
          name,
          image
        )
      `)
      .eq('tripId', tripId);

    if (error) {
      console.error('Error fetching trip members:', error);
      return { data: null, error };
    }

    return { data: data as any as TripMemberWithUser[], error: null };
  } catch (error: any) {
    console.error('Error in getTripMembers:', error);
    return { data: null, error };
  }
};

// --- NEW: React Query hook for getTripMembers ---
export const useTripMembers = (tripId: string) => {
  return useQuery({
    queryKey: ['tripMembers', tripId],
    queryFn: async () => {
      const { data, error } = await getTripMembers(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};