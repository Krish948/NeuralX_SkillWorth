import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface ExpenseItem {
  category: string;
  amount: number;
}

export interface FinanceRow {
  id: string;
  user_id: string;
  income: number;
  expenses: ExpenseItem[];
  savings: number;
  financial_goal: string;
  goal_amount: number;
  created_at: string;
  updated_at: string;
}

export function useFinance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['finance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        expenses: (data.expenses as unknown as ExpenseItem[]) || [],
      } as FinanceRow;
    },
    enabled: !!user,
  });
}

export function useSaveFinance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { income?: number; expenses?: ExpenseItem[]; savings?: number; financial_goal?: string; goal_amount?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const payload = {
        income: input.income,
        expenses: input.expenses as unknown as Json,
        savings: input.savings,
        financial_goal: input.financial_goal,
        goal_amount: input.goal_amount,
      };
      const existing = await supabase.from('finance').select('id').eq('user_id', user.id).maybeSingle();
      if (existing.data) {
        const { error } = await supabase.from('finance').update(payload).eq('id', existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('finance').insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance'] }),
  });
}
