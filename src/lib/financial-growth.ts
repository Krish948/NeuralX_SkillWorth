export interface DebtPayoffEstimate {
  months: number;
  totalInterest: number;
  monthlyPayment: number;
}

export interface SavingsMilestone {
  id: string;
  label: string;
  targetAmount: number;
  progress: number;
  remainingAmount: number;
  etaMonths: number | null;
  achieved: boolean;
}

export interface FinancialGrowthInput {
  income: number;
  totalExpenses: number;
  essentialsExpenses: number;
  currentSavings: number;
  goalAmount: number;
  debtBalance: number;
  debtApr: number;
  debtMonthlyPayment: number;
}

export interface FinancialGrowthStrategy {
  netCashflow: number;
  burnRate: number;
  runwayMonths: number | null;
  emergencyFundTarget: number;
  savingsCapacity: number;
  debtPayoff: DebtPayoffEstimate | null;
  savingsMilestones: SavingsMilestone[];
}

function toSafePositive(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function computeDebtPayoff(balance: number, apr: number, monthlyPayment: number): DebtPayoffEstimate | null {
  const debtBalance = toSafePositive(balance);
  const annualRate = Math.max(0, apr);
  const payment = toSafePositive(monthlyPayment);

  if (debtBalance <= 0 || payment <= 0) return null;

  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return {
      months: Math.ceil(debtBalance / payment),
      totalInterest: 0,
      monthlyPayment: payment,
    };
  }

  const firstMonthInterest = debtBalance * monthlyRate;
  if (payment <= firstMonthInterest) {
    return null;
  }

  let months = 0;
  let remaining = debtBalance;
  let totalInterest = 0;

  while (remaining > 0 && months < 600) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining = remaining + interest - payment;
    months += 1;
  }

  if (remaining > 0) return null;

  return {
    months,
    totalInterest: Math.round(totalInterest),
    monthlyPayment: payment,
  };
}

function buildMilestones(params: {
  essentialsExpenses: number;
  currentSavings: number;
  goalAmount: number;
  savingsCapacity: number;
}): SavingsMilestone[] {
  const { essentialsExpenses, currentSavings, goalAmount, savingsCapacity } = params;

  const milestones = [
    { id: 'runway-1', label: '1 month emergency cushion', targetAmount: Math.round(essentialsExpenses) },
    { id: 'runway-3', label: '3 month stability reserve', targetAmount: Math.round(essentialsExpenses * 3) },
    { id: 'runway-6', label: '6 month safety runway', targetAmount: Math.round(essentialsExpenses * 6) },
  ];

  if (goalAmount > 0) {
    milestones.push({ id: 'custom-goal', label: 'Primary savings goal', targetAmount: Math.round(goalAmount) });
  }

  const unique = milestones.filter((milestone, index, arr) => {
    if (milestone.targetAmount <= 0) return false;
    return arr.findIndex(item => item.targetAmount === milestone.targetAmount) === index;
  });

  return unique
    .sort((a, b) => a.targetAmount - b.targetAmount)
    .map(milestone => {
      const progress = milestone.targetAmount > 0 ? Math.min(100, Math.round((currentSavings / milestone.targetAmount) * 100)) : 0;
      const remainingAmount = Math.max(0, milestone.targetAmount - currentSavings);
      const etaMonths = remainingAmount === 0
        ? 0
        : savingsCapacity > 0
          ? Math.ceil(remainingAmount / savingsCapacity)
          : null;

      return {
        ...milestone,
        progress,
        remainingAmount,
        etaMonths,
        achieved: remainingAmount === 0,
      };
    });
}

export function buildFinancialGrowthStrategy(input: FinancialGrowthInput): FinancialGrowthStrategy {
  const income = toSafePositive(input.income);
  const totalExpenses = toSafePositive(input.totalExpenses);
  const essentialsExpenses = toSafePositive(input.essentialsExpenses);
  const currentSavings = toSafePositive(input.currentSavings);
  const goalAmount = toSafePositive(input.goalAmount);
  const debtBalance = toSafePositive(input.debtBalance);
  const debtApr = Math.max(0, input.debtApr);
  const debtMonthlyPayment = toSafePositive(input.debtMonthlyPayment);

  const netCashflow = Math.round(income - totalExpenses);
  const burnRate = Math.max(0, Math.round(totalExpenses - income));
  const runwayMonths = essentialsExpenses > 0 ? Number((currentSavings / essentialsExpenses).toFixed(1)) : null;
  const emergencyFundTarget = Math.round(essentialsExpenses * 6);
  const savingsCapacity = Math.max(0, netCashflow);

  const debtPayoff = computeDebtPayoff(debtBalance, debtApr, debtMonthlyPayment);
  const savingsMilestones = buildMilestones({
    essentialsExpenses,
    currentSavings,
    goalAmount,
    savingsCapacity,
  });

  return {
    netCashflow,
    burnRate,
    runwayMonths,
    emergencyFundTarget,
    savingsCapacity,
    debtPayoff,
    savingsMilestones,
  };
}
