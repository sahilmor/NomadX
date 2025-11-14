import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Expense = Tables<'Expense'>;
type ExpenseInsert = TablesInsert<'Expense'>;
type ExpenseUpdate = TablesUpdate<'Expense'>;

export const getTripExpenses = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .select('*')
      .eq('tripId', tripId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return { data: null, error };
    }

    return { data: data as Expense[], error: null };
  } catch (error: any) {
    console.error('Error in getTripExpenses:', error);
    return { data: null, error };
  }
};

export const useTripExpenses = (tripId: string) => {
  return useQuery({
    queryKey: ['expenses', tripId],
    queryFn: async () => {
      const { data, error } = await getTripExpenses(tripId);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tripId,
  });
};

export const getTripTotalExpenses = async (tripId: string) => {
  try {
    const { data, error } = await getTripExpenses(tripId);

    if (error || !data) {
      return { total: 0, error };
    }

    const total = data.reduce((sum, expense) => sum + expense.amount, 0);
    return { total, error: null };
  } catch (error: any) {
    console.error('Error in getTripTotalExpenses:', error);
    return { total: 0, error };
  }
};

export const getUserTotalExpenses = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .select('amount')
      .eq('payerId', userId);

    if (error) {
      console.error('Error fetching user expenses:', error);
      return { total: 0, error };
    }

    const total = (data || []).reduce((sum, expense) => sum + expense.amount, 0);
    return { total, error: null };
  } catch (error: any) {
    console.error('Error in getUserTotalExpenses:', error);
    return { total: 0, error };
  }
};

export const createExpense = async (expenseData: ExpenseInsert) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .insert(expenseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return { data: null, error };
    }

    return { data: data as Expense, error: null };
  } catch (error: any) {
    console.error('Error in createExpense:', error);
    return { data: null, error };
  }
};

export const useCreateExpense = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
    },
  });
};

export const updateExpense = async ({ id, updates }: { id: string, updates: ExpenseUpdate }) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return { data: null, error };
    }

    return { data: data as Expense, error: null };
  } catch (error: any) {
    console.error('Error in updateExpense:', error);
    return { data: null, error };
  }
};

export const useUpdateExpense = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
    },
  });
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const { error } = await supabase
      .from('Expense')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return { error };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error in deleteExpense:', error);
    return { error };
  }
};

export const useDeleteExpense = (tripId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
    },
  });
};