import { describe, expect, it } from 'vitest';
import {
  buildActionNudges,
  buildFinanceProjection,
  buildLearningPlan,
  buildMilestonesFromPlan,
  getRoleReadiness,
  mergeMilestones,
} from '@/lib/phase3';
import type { JobRow } from '@/hooks/useJobs';

const jobs: JobRow[] = [
  {
    id: 'job-1',
    role: 'Frontend Developer',
    required_skills: ['React', 'TypeScript', 'Next.js'],
    salary_min: 60000,
    salary_max: 120000,
    category: 'frontend',
  },
  {
    id: 'job-2',
    role: 'Full Stack Developer',
    required_skills: ['React', 'Node.js', 'SQL', 'Docker'],
    salary_min: 70000,
    salary_max: 140000,
    category: 'fullstack',
  },
];

describe('phase3', () => {
  it('builds a prioritized learning plan', () => {
    const plan = buildLearningPlan(['React'], jobs, 6, 3);

    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0].priority).toBe(1);
    expect(plan[0].resources.length).toBeGreaterThan(0);
  });

  it('generates and merges milestones preserving user status', () => {
    const plan = buildLearningPlan(['React'], jobs, 6, 2);
    const generated = buildMilestonesFromPlan(plan, 6, new Date('2026-01-01T00:00:00.000Z'));

    const customized = [{
      ...generated[0],
      status: 'completed' as const,
      updatedAtIso: '2026-01-10T00:00:00.000Z',
    }];

    const merged = mergeMilestones(customized, generated);
    expect(merged[0].status).toBe('completed');
    expect(merged.length).toBe(generated.length);
  });

  it('calculates readiness against a target role', () => {
    const readiness = getRoleReadiness(['React', 'TypeScript'], jobs[0]);
    expect(readiness?.score).toBe(67);
    expect(readiness?.missingRequired).toEqual(['Next.js']);
    expect(readiness?.readyToApply).toBe(false);
  });

  it('projects finances and determines goal month', () => {
    const plan = buildLearningPlan(['React'], jobs, 8, 2);
    const milestones = buildMilestonesFromPlan(plan, 8, new Date('2026-01-01T00:00:00.000Z')).map(m => ({
      ...m,
      dueDateIso: '2026-02-01T00:00:00.000Z',
      status: 'completed' as const,
    }));

    const projection = buildFinanceProjection({
      baseSkills: ['React'],
      milestones,
      baseMonthlyIncome: 50000,
      monthlyExpenses: 30000,
      currentSavings: 10000,
      goalAmount: 70000,
      months: 6,
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(projection.points.length).toBe(6);
    expect(projection.goalReachedMonth).not.toBeNull();
  });

  it('creates high-priority nudges for overdue milestones', () => {
    const nudges = buildActionNudges({
      milestones: [
        {
          id: 'm1',
          skill: 'Next.js',
          title: 'Complete Next.js sprint',
          dueDateIso: '2025-01-01T00:00:00.000Z',
          estimatedHours: 10,
          status: 'planned',
          createdAtIso: '2025-01-01T00:00:00.000Z',
          updatedAtIso: '2025-01-01T00:00:00.000Z',
        },
      ],
      lastActiveIso: '2025-01-01T00:00:00.000Z',
      weeklyHours: 3,
      hasFinancePlan: false,
      readiness: getRoleReadiness(['React'], jobs[0]),
    });

    expect(nudges.some(n => n.id === 'overdue-milestones')).toBe(true);
    expect(nudges.some(n => n.id === 'missing-finance-plan')).toBe(true);
  });
});
