import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Expense = Tables<'Expense'>;
type ExpenseInsert = TablesInsert<'Expense'>;
type ExpenseUpdate = TablesUpdate<'Expense'>;

// Get total expenses for a trip
export const getTripExpenses = async (tripId: string) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .select('*')
      .eq('tripId', tripId);

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

// Get total expenses amount for a trip
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

// Get user's total expenses across all trips
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

// Create expense
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

// Update expense
export const updateExpense = async (expenseId: string, updates: ExpenseUpdate) => {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .update(updates)
      .eq('id', expenseId)
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

// Delete expense
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

