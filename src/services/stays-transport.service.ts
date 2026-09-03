import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type Stay = {
  id: string;
  tripId: string;
  cityStopId: string | null;
  name: string;
  type: string;
  tier: 'BUDGET' | 'MIDRANGE' | 'UNIQUE' | string;
  costPerNight: number;
  currency: string;
  location: string | null;
  description: string | null;
  nights: number;
};

export type TransportOption = {
  id: string;
  tripId: string;
  mode: string;
  scope: 'INTERCITY' | 'LOCAL' | string;
  fromCity: string | null;
  toCity: string | null;
  cost: number | null;
  currency: string;
  duration: string | null;
  tips: string | null;
  selected: boolean;
};

export type CityStopInfo = {
  id: string;
  name: string;
  arrival: string;
  departure: string;
};

export const useTripStays = (tripId: string) =>
  useQuery({
    queryKey: ['stays', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Stay')
        .select('*')
        .eq('tripId', tripId)
        .order('costPerNight', { ascending: true });
      if (error) throw error;
      return (data || []) as Stay[];
    },
    enabled: !!tripId,
  });

export const useTripTransport = (tripId: string) =>
  useQuery({
    queryKey: ['transport', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('TransportOption')
        .select('*')
        .eq('tripId', tripId)
        .order('cost', { ascending: true });
      if (error) throw error;
      return (data || []) as TransportOption[];
    },
    enabled: !!tripId,
  });

export const useTripCityStops = (tripId: string) =>
  useQuery({
    queryKey: ['cityStops', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('CityStop')
        .select('id, name, arrival, departure')
        .eq('tripId', tripId)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data || []) as CityStopInfo[];
    },
    enabled: !!tripId,
  });

export const googleMapsUrl = (stay: { name: string; location: string | null }) => {
  const q = encodeURIComponent([stay.name, stay.location].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};

export const bookingUrl = (stay: { name: string; location: string | null }) => {
  const q = encodeURIComponent([stay.name, stay.location].filter(Boolean).join(', '));
  return `https://www.booking.com/search.html?ss=${q}`;
};

/**
 * Keeps exactly one Expense row per picked stay. Its amount always equals
 * costPerNight x assigned nights. Deleting the pick deletes the expense.
 */
const syncStayExpense = async (
  userId: string,
  stay: Stay,
  nights: number,
  cityName?: string
) => {
  const marker = `Stay pick ${stay.id}`;
  const { data: existing } = await supabase
    .from('Expense')
    .select('id')
    .eq('tripId', stay.tripId)
    .eq('category', 'STAY')
    .ilike('notes', `${marker}%`)
    .limit(1);

  if (nights <= 0) {
    if (existing?.length) {
      await supabase.from('Expense').delete().eq('id', existing[0].id);
    }
    return;
  }

  const amount = Math.round(stay.costPerNight * nights);
  const label = `Stay pick ${stay.id} — ${stay.name} (${nights} night${nights > 1 ? 's' : ''}${cityName ? `, ${cityName}` : ''})`;

  if (existing?.length) {
    await supabase.from('Expense').update({ amount, notes: label }).eq('id', existing[0].id);
  } else {
    await supabase.from('Expense').insert({
      id: crypto.randomUUID(),
      tripId: stay.tripId,
      category: 'STAY',
      amount,
      currency: stay.currency,
      payerId: userId,
      notes: label,
    });
  }
};

export const useSetStayNights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stay,
      nights,
      cityName,
    }: {
      stay: Stay;
      nights: number;
      cityName?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not logged in');

      const clamped = Math.max(0, nights);
      await supabase.from('Stay').update({ nights: clamped }).eq('id', stay.id);
      await syncStayExpense(userId, { ...stay, nights: clamped }, clamped, cityName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stays', variables.stay.tripId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.stay.tripId] });
    },
  });
};

export const useToggleTransport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ option, picked }: { option: TransportOption; picked: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not logged in');

      await supabase.from('TransportOption').update({ selected: picked }).eq('id', option.id);

      const marker = `Transport pick ${option.id}`;
      const { data: existing } = await supabase
        .from('Expense')
        .select('id')
        .eq('tripId', option.tripId)
        .eq('category', 'TRANSPORT')
        .ilike('notes', `${marker}%`)
        .limit(1);

      if (!picked || option.cost == null) {
        if (existing?.length) {
          await supabase.from('Expense').delete().eq('id', existing[0].id);
        }
        return;
      }

      const route =
        option.scope === 'INTERCITY'
          ? `${option.fromCity || '?'} \u2192 ${option.toCity || '?'}`
          : option.fromCity || 'Local';
      const label = `Transport pick ${option.id} \u2014 ${option.mode.replace(/_/g, ' ')} (${route})`;

      if (existing?.length) {
        await supabase.from('Expense').update({ amount: Math.round(option.cost), notes: label }).eq('id', existing[0].id);
      } else {
        await supabase.from('Expense').insert({
          id: crypto.randomUUID(),
          tripId: option.tripId,
          category: 'TRANSPORT',
          amount: Math.round(option.cost),
          currency: option.currency,
          payerId: userId,
          notes: label,
        });
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['transport', vars.option.tripId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', vars.option.tripId] });
    },
  });
};
