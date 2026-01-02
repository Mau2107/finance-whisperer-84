import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Budget } from '@/types/finance';
import { toast } from 'sonner';

interface DbBudget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string;
  created_at: string;
  updated_at: string;
}

const mapDbToBudget = (db: DbBudget): Budget => ({
  id: db.id,
  category: db.category,
  limit: Number(db.amount),
  spent: 0, // Will be calculated from transactions
  period: db.period as Budget['period'],
});

export const useBudgets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(mapDbToBudget);
    },
    enabled: !!user,
  });

  // Multi-device realtime sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('budgets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['budgets', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const addBudget = useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'spent'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: budget.category,
          amount: budget.limit,
          period: budget.period,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToBudget(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget created');
    },
    onError: (error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Budget for this category already exists');
      } else {
        toast.error('Failed to create budget: ' + error.message);
      }
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: Record<string, unknown> = {};
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.limit !== undefined) dbUpdates.amount = updates.limit;
      if (updates.period !== undefined) dbUpdates.period = updates.period;

      const { error } = await supabase
        .from('budgets')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget updated');
    },
    onError: (error) => {
      toast.error('Failed to update budget: ' + error.message);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete budget: ' + error.message);
    },
  });

  return {
    budgets,
    isLoading,
    addBudget: addBudget.mutate,
    updateBudget: (id: string, updates: Partial<Budget>) => 
      updateBudget.mutate({ id, updates }),
    deleteBudget: deleteBudget.mutate,
  };
};
