import { describe, expect, it } from 'vitest';
import { buildAdaptiveLearningPlan } from '@/lib/adaptive-planner';
import type { JobRow } from '@/hooks/useJobs';
import { buildLearningPlan, buildMilestonesFromPlan, getRoleReadiness } from '@/lib/career-roadmap';

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

describe('adaptive-planner', () => {
  it('prioritizes overdue and readiness-gap skills first', () => {
    const learningPlan = buildLearningPlan(['React'], jobs, 6, 3);
    const milestones = buildMilestonesFromPlan(learningPlan, 6, new Date('2026-01-01T00:00:00.000Z')).map((milestone, index) =>
      index === 0
        ? {
            ...milestone,
            dueDateIso: '2025-01-01T00:00:00.000Z',
            status: 'planned' as const,
          }
        : {
            ...milestone,
            status: 'in-progress' as const,
          },
    );

    const adaptive = buildAdaptiveLearningPlan({
      learningPlan,
      milestones,
      weeklyHours: 3,
      lastActiveIso: '2025-01-01T00:00:00.000Z',
      readiness: getRoleReadiness(['React', 'TypeScript'], jobs[0]),
      hasFinancePlan: false,
    });

    expect(adaptive.summary.needsReset).toBe(true);
    expect(adaptive.summary.topPrioritySkill).toBeDefined();
    expect(adaptive.items[0].focusReason.length).toBeGreaterThan(0);
    expect(adaptive.items[0].nextStep.length).toBeGreaterThan(0);
  });

  it('drops completed skills from the active adaptive plan', () => {
    const learningPlan = buildLearningPlan(['React'], jobs, 6, 3);
    const milestones = buildMilestonesFromPlan(learningPlan, 6, new Date('2026-01-01T00:00:00.000Z')).map((milestone, index) =>
      index === 0
        ? {
            ...milestone,
            status: 'completed' as const,
          }
        : milestone,
    );

    const adaptive = buildAdaptiveLearningPlan({
      learningPlan,
      milestones,
      weeklyHours: 6,
      lastActiveIso: null,
      readiness: null,
      hasFinancePlan: true,
    });

    expect(adaptive.items.every(item => item.status !== 'completed')).toBe(true);
  });
});
