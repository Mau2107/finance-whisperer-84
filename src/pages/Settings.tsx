import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { Label } from '@/components/ui/label';
import { Helmet } from 'react-helmet-async';

export default function Settings() {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();

  return (
    <>
      <Helmet>
        <title>Settings | FinanceIQ</title>
        <meta name="description" content="Manage your FinanceIQ preferences" />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <Label className="text-foreground">Demo Mode</Label>
                <p className="text-sm text-muted-foreground">
                  You're using the demo version of FinanceIQ
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Your Data</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">Transactions</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{budgets.length}</p>
                <p className="text-sm text-muted-foreground">Budgets</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {transactions.filter((t) => t.type === 'income').length}
                </p>
                <p className="text-sm text-muted-foreground">Income Records</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {transactions.filter((t) => t.type === 'expense').length}
                </p>
                <p className="text-sm text-muted-foreground">Expense Records</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
