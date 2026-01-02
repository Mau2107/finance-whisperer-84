import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, TransactionType } from '@/types/finance';
import { toast } from 'sonner';
interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  payment_method: string | null;
  date: string;
  tags: string[] | null;
  is_recurring: boolean | null;
  created_at: string;
  updated_at: string;
}

const mapDbToTransaction = (db: DbTransaction): Transaction => ({
  id: db.id,
  type: db.type as TransactionType,
  amount: Number(db.amount),
  category: db.category,
  description: db.description || '',
  paymentMethod: db.payment_method as Transaction['paymentMethod'],
  date: db.date,
  tags: db.tags || [],
  isRecurring: db.is_recurring || false,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const useTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbToTransaction);
    },
    enabled: !!user,
  });

  // Multi-device realtime sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description || null,
          payment_method: transaction.paymentMethod || null,
          date: transaction.date,
          tags: transaction.tags || [],
          is_recurring: transaction.isRecurring || false,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToTransaction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction added');
    },
    onError: (error) => {
      toast.error('Failed to add transaction: ' + error.message);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: Record<string, unknown> = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction updated');
    },
    onError: (error) => {
      toast.error('Failed to update transaction: ' + error.message);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete transaction: ' + error.message);
    },
  });

  // Computed values
  const getTotalIncome = () => 
    transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);

  const getTotalExpense = () => 
    transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

  const getBalance = () => getTotalIncome() - getTotalExpense();

  const getTransactionsByType = (type: TransactionType) => 
    transactions.filter(tx => tx.type === type);

  const getCategoryTotals = (type: TransactionType) => {
    return getTransactionsByType(type).reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const getMonthlyData = () => {
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 });
      }
      
      const data = monthlyMap.get(monthKey)!;
      if (tx.type === 'income') {
        data.income += tx.amount;
      } else {
        data.expense += tx.amount;
      }
    });
    
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  return {
    transactions,
    isLoading,
    addTransaction: addTransaction.mutate,
    updateTransaction: (id: string, updates: Partial<Transaction>) => 
      updateTransaction.mutate({ id, updates }),
    deleteTransaction: deleteTransaction.mutate,
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getTransactionsByType,
    getCategoryTotals,
    getMonthlyData,
  };
};
