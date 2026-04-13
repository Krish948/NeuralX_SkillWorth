import { useState, useEffect } from 'react';
import { useFinance, useSaveFinance, ExpenseItem } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Wallet, Plus, X, Target, PiggyBank, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Shopping', 'Other'];
const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#94a3b8'];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Failed to save financial plan';
}

export default function Finance() {
  const isMobile = useIsMobile();
  const { data: finance, isLoading, error } = useFinance();
  const saveFinance = useSaveFinance();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpCat, setNewExpCat] = useState('');
  const [newExpAmt, setNewExpAmt] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState(0);

  useEffect(() => {
    if (finance) {
      setIncome(Number(finance.income) || 0);
      setExpenses((finance.expenses as ExpenseItem[]) || []);
      setGoalName(finance.financial_goal || '');
      setGoalAmount(Number(finance.goal_amount) || 0);
    }
  }, [finance]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const savings = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((Number(finance?.savings || 0) / goalAmount) * 100)) : 0;

  const addExpense = () => {
    if (!newExpCat || !newExpAmt) return;
    setExpenses([...expenses, { category: newExpCat, amount: parseFloat(newExpAmt) }]);
    setNewExpCat('');
    setNewExpAmt('');
  };

  const removeExpense = (i: number) => setExpenses(expenses.filter((_, idx) => idx !== i));

  const handleSave = () => {
    saveFinance.mutate(
      { income, expenses, savings, financial_goal: goalName, goal_amount: goalAmount },
      { onSuccess: () => toast.success('Financial plan saved!'), onError: (err: unknown) => toast.error(getErrorMessage(err)) }
    );
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading finance planner"
          description="Preparing your salary and savings insights..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load finance data"
          description="Please refresh and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Finance Planner</h1>
          <p className="text-muted-foreground mt-1">Budget, save, and reach your financial goals</p>
        </div>
        <Button onClick={handleSave} disabled={saveFinance.isPending}>Save Plan</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Income', value: formatINR(income), icon: Wallet, cls: 'gradient-career' },
          { label: 'Total Expenses', value: formatINR(totalExpenses), icon: TrendingDown, cls: 'gradient-salary' },
          { label: 'Net Savings', value: formatINR(savings), icon: PiggyBank, cls: savings >= 0 ? 'gradient-finance' : 'bg-destructive' },
          { label: 'Savings Rate', value: `${savingsRate}%`, icon: Target, cls: 'gradient-simulation' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.cls} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-display font-bold truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly Income (INR)</Label>
              <Input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} placeholder="5000" />
            </div>

            <div className="space-y-2">
              <Label>Add Expense</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={newExpCat} onValueChange={setNewExpCat}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="w-full sm:w-28" type="number" value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)} placeholder="Amount" />
                <Button size="icon" className="w-full sm:w-10" onClick={addExpense}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              {expenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{e.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatINR(e.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExpense(i)}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Add expenses to see breakdown</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenses} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={isMobile ? false : ({ category, amount }) => `${category}: ${formatINR(amount)}`} labelLine={!isMobile}>
                        {expenses.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" /> Financial Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g., Emergency Fund" />
              <div className="space-y-1">
                <Label>Goal Amount (INR)</Label>
                <Input type="number" value={goalAmount || ''} onChange={e => setGoalAmount(Number(e.target.value))} placeholder="10000" />
              </div>
              {goalAmount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goalProgress}%</span>
                  </div>
                  <Progress value={goalProgress} className="h-2" />
                  {savings > 0 && (
                    <p className="text-xs text-muted-foreground">
                      At current savings rate, you'll reach your goal in ~{Math.ceil((goalAmount - (Number(finance?.savings || 0))) / savings)} months
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
