import { useEffect, useMemo, useState } from 'react';
import { useFinance, useSaveFinance, ExpenseItem } from '@/hooks/useFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Wallet, Plus, X, Target, PiggyBank, TrendingDown, CalendarDays, Repeat2, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Shopping', 'Other'];
const PAYMENT_MODES: Array<NonNullable<ExpenseItem['paymentMode']>> = ['UPI', 'Card', 'Cash', 'Bank Transfer', 'Auto Debit'];
const PIE_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#94a3b8'];
const PIE_COLOR_CLASSES = ['bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-sky-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-slate-400'];
const ESSENTIAL_CATEGORIES = ['Housing', 'Food', 'Transport', 'Utilities', 'Healthcare', 'Education'];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Failed to save financial plan';
}

function getMonthKey(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 7);
  }
  return parsed.toISOString().slice(0, 7);
}

function normalizeExpenses(rawExpenses: ExpenseItem[] | null | undefined): ExpenseItem[] {
  return (rawExpenses || []).map((expense, index) => {
    const amount = Number(expense.amount) || 0;
    const date = expense.date && expense.date.length >= 10 ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return {
      id: expense.id || `${expense.category || 'expense'}-${amount}-${date}-${index}`,
      category: expense.category || 'Other',
      amount,
      date,
      note: expense.note || '',
      paymentMode: expense.paymentMode || 'UPI',
      isRecurring: Boolean(expense.isRecurring),
    };
  });
}

export default function Finance() {
  const isMobile = useIsMobile();
  const { data: finance, isLoading, error } = useFinance();
  const saveFinance = useSaveFinance();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newExpCat, setNewExpCat] = useState('');
  const [newExpAmt, setNewExpAmt] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpMode, setNewExpMode] = useState<NonNullable<ExpenseItem['paymentMode']>>('UPI');
  const [newExpNote, setNewExpNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (finance) {
      setIncome(Number(finance.income) || 0);
      setExpenses(normalizeExpenses(finance.expenses as ExpenseItem[]));
      setGoalName(finance.financial_goal || '');
      setGoalAmount(Number(finance.goal_amount) || 0);
    }
  }, [finance]);

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(expenses.map(expense => getMonthKey(expense.date || '')))).sort().reverse();
    return keys;
  }, [expenses]);

  useEffect(() => {
    if (monthFilter !== 'all' && monthOptions.length > 0 && !monthOptions.includes(monthFilter)) {
      setMonthFilter(monthOptions[0]);
    }
  }, [monthFilter, monthOptions]);

  const selectedMonthExpenses = useMemo(() => {
    if (monthFilter === 'all') return expenses;
    return expenses.filter(expense => getMonthKey(expense.date || '') === monthFilter);
  }, [expenses, monthFilter]);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return selectedMonthExpenses
      .filter(expense => (categoryFilter === 'all' ? true : expense.category === categoryFilter))
      .filter(expense => {
        if (normalizedSearch.length === 0) return true;
        const note = (expense.note || '').toLowerCase();
        const category = expense.category.toLowerCase();
        const mode = (expense.paymentMode || '').toLowerCase();
        return note.includes(normalizedSearch) || category.includes(normalizedSearch) || mode.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || '').getTime();
        const dateB = new Date(b.date || '').getTime();
        return dateB - dateA;
      });
  }, [categoryFilter, searchTerm, selectedMonthExpenses]);

  const totalExpenses = selectedMonthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const currentSavings = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((currentSavings / income) * 100) : 0;
  const goalProgress = goalAmount > 0 ? Math.min(100, Math.round((Math.max(0, currentSavings) / goalAmount) * 100)) : 0;

  const essentialsSpend = selectedMonthExpenses
    .filter(expense => ESSENTIAL_CATEGORIES.includes(expense.category))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const discretionarySpend = totalExpenses - essentialsSpend;
  const discretionaryShare = totalExpenses > 0 ? Math.round((discretionarySpend / totalExpenses) * 100) : 0;
  const essentialsShare = totalExpenses > 0 ? Math.round((essentialsSpend / totalExpenses) * 100) : 0;
  const requiredMonthlyForGoal = goalAmount > 0 ? Math.max(Math.round(goalAmount / 12), 0) : 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    selectedMonthExpenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedMonthExpenses]);

  const topCategory = categoryTotals[0];
  const averageTransactionValue = filteredExpenses.length > 0 ? Math.round(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length) : 0;

  const expenseChartData = categoryTotals.length <= 6
    ? categoryTotals
    : [
        ...categoryTotals.slice(0, 5),
        {
          category: 'Other',
          amount: categoryTotals.slice(5).reduce((sum, item) => sum + item.amount, 0),
        },
      ];

  let budgetHealthScore = 45;
  if (savingsRate >= 30) budgetHealthScore += 30;
  else if (savingsRate >= 20) budgetHealthScore += 20;
  else if (savingsRate >= 10) budgetHealthScore += 10;

  if (essentialsShare <= 70) budgetHealthScore += 15;
  if (goalAmount > 0 && currentSavings >= requiredMonthlyForGoal) budgetHealthScore += 10;
  budgetHealthScore = Math.max(0, Math.min(100, budgetHealthScore));

  const financeAlerts: string[] = [];
  if (income <= 0) {
    financeAlerts.push('Add your monthly income to unlock accurate monthly tracking.');
  }
  if (savingsRate < 20 && income > 0) {
    financeAlerts.push('Savings rate is below 20%. Tighten variable spending for a healthier cushion.');
  }
  if (discretionaryShare > 35) {
    financeAlerts.push(`Discretionary spending is ${discretionaryShare}% this month. Aim for 30-35% or less.`);
  }
  if (goalAmount > 0 && currentSavings > 0 && currentSavings < requiredMonthlyForGoal) {
    financeAlerts.push(`To hit your goal in 12 months, keep monthly savings around ${formatINR(requiredMonthlyForGoal)}.`);
  }
  if (financeAlerts.length === 0) {
    financeAlerts.push('Tracking looks stable this month. Keep consistency and review weekly.');
  }

  const addExpense = () => {
    if (!newExpCat) {
      toast.error('Please choose a category.');
      return;
    }

    const amount = Number(newExpAmt);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid expense amount.');
      return;
    }

    if (!newExpDate) {
      toast.error('Please select a date.');
      return;
    }

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: newExpCat,
      amount,
      date: newExpDate,
      paymentMode: newExpMode,
      note: newExpNote.trim(),
      isRecurring,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setNewExpCat('');
    setNewExpAmt('');
    setNewExpNote('');
    setIsRecurring(false);
  };

  const removeExpense = (expenseId?: string) => {
    if (!expenseId) return;
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
  };

  const handleSave = () => {
    saveFinance.mutate(
      { income, expenses, savings: currentSavings, financial_goal: goalName, goal_amount: goalAmount },
      { onSuccess: () => toast.success('Expense tracker saved successfully.'), onError: (err: unknown) => toast.error(getErrorMessage(err)) }
    );
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading expense tracker"
          description="Preparing your transactions and monthly insights..."
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
      <section className="page-hero">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Expense Tracker</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Monthly control</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Track every expense with proper monthly clarity.</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">Capture date, category, payment mode, and notes, then monitor category trends and savings impact in real time.</p>
          </div>
          <Button onClick={handleSave} disabled={saveFinance.isPending} className="hover-glow">Save Tracker</Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Health', value: `${budgetHealthScore}/100` },
          { label: 'Income', value: formatINR(income) },
          { label: 'Month spend', value: formatINR(totalExpenses) },
          { label: 'Savings', value: formatINR(currentSavings) },
          { label: 'Transactions', value: `${selectedMonthExpenses.length}` },
        ].map(tile => (
          <Card key={tile.label} className="panel-soft">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{tile.label}</p>
              <p className="text-2xl font-display font-bold mt-2">{tile.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Monthly Intelligence</CardTitle>
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
                  { label: 'Income', value: formatINR(income), icon: Wallet, cls: 'gradient-career' },
                  { label: 'Expense Outflow', value: formatINR(totalExpenses), icon: TrendingDown, cls: 'gradient-salary' },
                  { label: 'Net Savings', value: formatINR(currentSavings), icon: PiggyBank, cls: currentSavings >= 0 ? 'gradient-finance' : 'bg-destructive' },
                  { label: 'Savings Rate', value: `${savingsRate}%`, icon: Target, cls: 'gradient-simulation' },
                ].map(summary => (
                  <div key={summary.label} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-md ${summary.cls} flex items-center justify-center flex-shrink-0`}>
                        <summary.icon className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{summary.label}</p>
                        <p className="text-sm font-semibold truncate">{summary.value}</p>
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

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly Income (INR)</Label>
                <Input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} placeholder="0" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newExpCat} onValueChange={setNewExpCat}>
                    <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (INR)</Label>
                  <Input type="number" value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)} placeholder="0" />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newExpDate} onChange={e => setNewExpDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={newExpMode} onValueChange={(value: NonNullable<ExpenseItem['paymentMode']>) => setNewExpMode(value)}>
                    <SelectTrigger><SelectValue placeholder="Payment mode" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input value={newExpNote} onChange={e => setNewExpNote(e.target.value)} placeholder="e.g., Team lunch, metro recharge" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  type="button"
                  variant={isRecurring ? 'default' : 'outline'}
                  onClick={() => setIsRecurring(prev => !prev)}
                  className="w-full sm:w-auto"
                >
                  <Repeat2 className="w-4 h-4 mr-2" />
                  {isRecurring ? 'Recurring expense' : 'Mark recurring'}
                </Button>
                <Button type="button" onClick={addExpense} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Add Transaction
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Transaction Ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <Input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by note, category, payment mode"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {monthOptions.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {filteredExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No transactions match current filters.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {filteredExpenses.map(expense => (
                    <article key={expense.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">{expense.category}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{expense.paymentMode || 'UPI'}</Badge>
                            {expense.isRecurring && <Badge className="text-[10px]">Recurring</Badge>}
                          </div>
                          <p className="text-sm font-semibold mt-2">{formatINR(expense.amount)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{expense.date}</span>
                          </div>
                          {expense.note && <p className="text-xs text-muted-foreground mt-1 truncate">{expense.note}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeExpense(expense.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="gradient-finance hover-glow text-primary-foreground border-border/50">
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
                  {currentSavings > 0 && (
                    <p className="text-xs opacity-90">
                      At current pace you can reach this in about {Math.ceil(Math.max(0, goalAmount - currentSavings) / currentSavings)} months.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs opacity-90">Set your target amount to unlock pacing guidance.</p>
              )}
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Expense Mix</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Add transactions to see category breakdown.</p>
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
                          {expenseChartData.map((entry, index) => (
                            <Cell key={`${entry.category}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                    {expenseChartData.map((entry, index) => {
                      const percent = totalExpenses > 0 ? Math.round((entry.amount / totalExpenses) * 100) : 0;
                      return (
                        <div key={`${entry.category}-legend-${index}`} className="flex items-center justify-between rounded-2xl border border-border/60 px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${PIE_COLOR_CLASSES[index % PIE_COLOR_CLASSES.length]}`} />
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

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Tracker Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Top category</p>
                  <p className="text-sm font-semibold mt-1 truncate">{topCategory?.category || 'N/A'}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Avg txn</p>
                  <p className="text-sm font-semibold mt-1">{formatINR(averageTransactionValue)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {monthFilter === 'all' ? 'Viewing all transactions.' : `Tracking focus month: ${monthFilter}.`} Recurring expenses are tagged for easy monitoring.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
