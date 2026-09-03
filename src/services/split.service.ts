// src/services/split.service.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SplitShareRow = Tables<'SplitShare'>;

export type SplitWithExpense = SplitShareRow & {
  Expense: { tripId: string; payerId: string | null } | null;
};

export const getTripSplits = async (tripId: string) => {
  const { data: exps, error: expErr } = await supabase
    .from('Expense')
    .select('id')
    .eq('tripId', tripId);

  if (expErr) return { data: null, error: expErr };
  const ids = (exps || []).map((e: any) => e.id);
  if (ids.length === 0) return { data: [] as SplitWithExpense[], error: null };

  const { data, error } = await supabase
    .from('SplitShare')
    .select('*, Expense(tripId, payerId)')
    .in('expenseId', ids);

  return { data: (data || []) as SplitWithExpense[], error: error || null };
};

export const useTripSplits = (tripId: string) => {
  return useQuery({
    queryKey: ['splits', tripId],
    queryFn: async () => {
      const { data, error } = await getTripSplits(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};

export type NewSplitShare = {
  userId: string;
  share: number;
  settled: boolean;
};

/** Replace the split configuration of one expense atomically. */
export const replaceSplits = async ({
  expenseId,
  shares,
}: {
  expenseId: string;
  shares: NewSplitShare[];
}) => {
  const del = await supabase.from('SplitShare').delete().eq('expenseId', expenseId);
  if (del.error) throw del.error;

  if (shares.length === 0) return;

  const rows = shares.map((s) => ({
    id: crypto.randomUUID(),
    expenseId,
    userId: s.userId,
    share: s.share,
    settled: s.settled,
  }));
  const ins = await supabase.from('SplitShare').insert(rows);
  if (ins.error) throw ins.error;
};

export const useReplaceSplits = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replaceSplits,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits', tripId] });
    },
  });
};

export const toggleSplitSettled = async ({
  id,
  settled,
}: {
  id: string;
  settled: boolean;
}) => {
  const { error } = await supabase
    .from('SplitShare')
    .update({ settled })
    .eq('id', id);
  if (error) throw error;
};

export const useToggleSplitSettled = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSplitSettled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits', tripId] });
    },
  });
};
