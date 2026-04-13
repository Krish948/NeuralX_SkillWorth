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
const ESSENTIAL_CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Education'];

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
  const expenseChartEntries = expenses
    .filter(expense => expense.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const expenseChartData = expenseChartEntries.length <= 6
    ? expenseChartEntries
    : [
        ...expenseChartEntries.slice(0, 5),
        {
          category: 'Other',
          amount: expenseChartEntries.slice(5).reduce((sum, expense) => sum + expense.amount, 0),
        },
      ];
  const savings = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((Number(finance?.savings || 0) / goalAmount) * 100)) : 0;
  const essentialsSpend = expenses
    .filter(expense => ESSENTIAL_CATEGORIES.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const discretionarySpend = totalExpenses - essentialsSpend;
  const discretionaryShare = totalExpenses > 0 ? Math.round((discretionarySpend / totalExpenses) * 100) : 0;
  const essentialsShare = totalExpenses > 0 ? Math.round((essentialsSpend / totalExpenses) * 100) : 0;
  const requiredMonthlyForGoal = goalAmount > 0 ? Math.max(Math.round(goalAmount / 12), 0) : 0;

  let budgetHealthScore = 45;
  if (savingsRate >= 30) budgetHealthScore += 30;
  else if (savingsRate >= 20) budgetHealthScore += 20;
  else if (savingsRate >= 10) budgetHealthScore += 10;

  if (essentialsShare <= 70) budgetHealthScore += 15;
  if (goalAmount > 0 && savings >= requiredMonthlyForGoal) budgetHealthScore += 10;
  budgetHealthScore = Math.max(0, Math.min(100, budgetHealthScore));

  const financeAlerts: string[] = [];
  if (income <= 0) {
    financeAlerts.push('Add your monthly income to unlock more accurate guidance.');
  }
  if (savingsRate < 20 && income > 0) {
    financeAlerts.push('Savings rate is below 20%. Aim for at least 20% for stable growth.');
  }
  if (discretionaryShare > 35) {
    financeAlerts.push(`Discretionary spending is ${discretionaryShare}% of expenses. Consider trimming to 30-35%.`);
  }
  if (goalAmount > 0 && savings > 0 && savings < requiredMonthlyForGoal) {
    financeAlerts.push(`To hit your goal in 12 months, target monthly savings near ${formatINR(requiredMonthlyForGoal)}.`);
  }
  if (financeAlerts.length === 0) {
    financeAlerts.push('Budget looks healthy. Keep tracking monthly and continue skill growth for income upside.');
  }

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
          <p className="text-muted-foreground mt-1">Control spending, protect savings rate, and hit your target on time</p>
        </div>
        <Button onClick={handleSave} disabled={saveFinance.isPending}>Save Plan</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/50 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Finance Intelligence Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget health score</span>
                <span className="font-medium">{budgetHealthScore}/100</span>
              </div>
              <Progress value={budgetHealthScore} className="h-2 mt-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Monthly Income', value: formatINR(income), icon: Wallet, cls: 'gradient-career' },
                { label: 'Total Expenses', value: formatINR(totalExpenses), icon: TrendingDown, cls: 'gradient-salary' },
                { label: 'Net Savings', value: formatINR(savings), icon: PiggyBank, cls: savings >= 0 ? 'gradient-finance' : 'bg-destructive' },
                { label: 'Savings Rate', value: `${savingsRate}%`, icon: Target, cls: 'gradient-simulation' },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md ${s.cls} flex items-center justify-center flex-shrink-0`}>
                      <s.icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-sm font-semibold truncate">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Essential spend</p>
                <p className="text-sm font-semibold mt-1">{essentialsShare}% ({formatINR(essentialsSpend)})</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Discretionary spend</p>
                <p className="text-sm font-semibold mt-1">{discretionaryShare}% ({formatINR(discretionarySpend)})</p>
              </div>
            </div>

            <div className="space-y-2">
              {financeAlerts.map((alert, index) => (
                <div key={`${alert}-${index}`} className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 gradient-finance text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg font-display text-primary-foreground flex items-center gap-2">
              <Target className="w-5 h-5" /> Goal Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g., Emergency Fund" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/70" />
            <Input type="number" value={goalAmount || ''} onChange={e => setGoalAmount(Number(e.target.value))} placeholder="Goal amount" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/70" />
            {goalAmount > 0 ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="opacity-85">Progress</span>
                  <span className="font-semibold">{goalProgress}%</span>
                </div>
                <Progress value={goalProgress} className="h-2 bg-primary-foreground/20" />
                {savings > 0 && (
                  <p className="text-xs opacity-90">
                    At current pace you can reach this in about {Math.ceil((goalAmount - (Number(finance?.savings || 0))) / savings)} months.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs opacity-90">Set your target amount to unlock pacing guidance.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Budget Studio</CardTitle>
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
                <Input className="w-full sm:w-32" type="number" value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)} placeholder="Amount" />
                <Button size="icon" className="w-full sm:w-10" onClick={addExpense}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {expenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-muted/40">
                  <span className="text-sm truncate mr-2">{e.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap">{formatINR(e.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExpense(i)}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Expense Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseChartData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Add expenses to see breakdown</p>
            ) : (
              <>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 40 : 46}
                        outerRadius={isMobile ? 74 : 82}
                        minAngle={4}
                        paddingAngle={2}
                        label={false}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {expenseChartData.map((entry, i) => (
                          <Cell key={`${entry.category}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name, item: { payload?: { amount?: number; category?: string } }) => {
                          const amount = item?.payload?.amount ?? value;
                          const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                          return [`${formatINR(amount)} (${percent}%)`, item?.payload?.category ?? 'Category'];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2 mt-2">
                  {expenseChartData.map((entry, i) => {
                    const percent = totalExpenses > 0 ? Math.round((entry.amount / totalExpenses) * 100) : 0;
                    return (
                      <div key={`${entry.category}-legend-${i}`} className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="truncate">{entry.category}</span>
                        </div>
                        <span className="text-muted-foreground flex-shrink-0">{formatINR(entry.amount)} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
