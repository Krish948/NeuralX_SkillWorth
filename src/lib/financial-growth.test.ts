import { describe, expect, it } from 'vitest';
import { buildFinancialGrowthStrategy } from '@/lib/financial-growth';

describe('financial-growth', () => {
  it('computes runway, burn-rate, and debt payoff estimates', () => {
    const strategy = buildFinancialGrowthStrategy({
      income: 90000,
      totalExpenses: 60000,
      essentialsExpenses: 35000,
      currentSavings: 105000,
      goalAmount: 300000,
      debtBalance: 240000,
      debtApr: 12,
      debtMonthlyPayment: 12000,
    });

    expect(strategy.netCashflow).toBe(30000);
    expect(strategy.burnRate).toBe(0);
    expect(strategy.runwayMonths).toBe(3);
    expect(strategy.emergencyFundTarget).toBe(210000);
    expect(strategy.debtPayoff).not.toBeNull();
    expect(strategy.savingsMilestones.length).toBeGreaterThan(0);
  });

  it('returns null debt payoff when payment cannot cover monthly interest', () => {
    const strategy = buildFinancialGrowthStrategy({
      income: 60000,
      totalExpenses: 65000,
      essentialsExpenses: 40000,
      currentSavings: 50000,
      goalAmount: 0,
      debtBalance: 400000,
      debtApr: 24,
      debtMonthlyPayment: 2000,
    });

    expect(strategy.burnRate).toBe(5000);
    expect(strategy.debtPayoff).toBeNull();
  });

  it('creates milestone ETAs from monthly savings capacity', () => {
    const strategy = buildFinancialGrowthStrategy({
      income: 70000,
      totalExpenses: 50000,
      essentialsExpenses: 30000,
      currentSavings: 30000,
      goalAmount: 90000,
      debtBalance: 0,
      debtApr: 0,
      debtMonthlyPayment: 0,
    });

    const nextMilestone = strategy.savingsMilestones.find(m => m.id === 'runway-3');
    expect(nextMilestone?.remainingAmount).toBe(60000);
    expect(nextMilestone?.etaMonths).toBe(3);
  });
});
