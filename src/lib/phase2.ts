import { calculateSalaryFromSkills, getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import type { JobRow } from '@/hooks/useJobs';

export type SkillRecommendation = {
  skill: string;
  salaryBoost: number;
  demandCount: number;
  matchOpportunity: number;
  score: number;
  reasons: string[];
};

export type WeeklyAction = {
  id: string;
  title: string;
  detail: string;
  impact: 'high' | 'medium';
};

export function getTopSkillRecommendations(userSkills: string[], jobs: JobRow[], limit = 3): SkillRecommendation[] {
  const userSet = new Set(userSkills);

  const demandBySkill: Record<string, number> = {};
  jobs.forEach(job => {
    job.required_skills.forEach(skill => {
      demandBySkill[skill] = (demandBySkill[skill] || 0) + 1;
    });
  });

  const recommendations = Object.entries(skillSalaryMap)
    .filter(([skill]) => !userSet.has(skill))
    .map(([skill, mapping]) => {
      const demandCount = demandBySkill[skill] || 0;
      const matchOpportunity = jobs.reduce((count, job) => {
        const hasSkill = job.required_skills.includes(skill);
        const currentMatch = getJobMatchScore(userSkills, job.required_skills);
        return hasSkill && currentMatch >= 40 && currentMatch < 100 ? count + 1 : count;
      }, 0);

      const score =
        mapping.salaryBoost * 0.45 +
        demandCount * 2200 +
        matchOpportunity * 3000;

      const reasons = [
        `Potential salary uplift around ${Math.round(mapping.salaryBoost / 12)} per month`,
        `${demandCount} role${demandCount === 1 ? '' : 's'} in your catalog require this skill`,
        `Could improve ${matchOpportunity} near-match job${matchOpportunity === 1 ? '' : 's'}`,
      ];

      return {
        skill,
        salaryBoost: mapping.salaryBoost,
        demandCount,
        matchOpportunity,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return recommendations;
}

export function getWeeklyActions(
  userSkills: string[],
  jobs: JobRow[],
  hasFinancePlan: boolean,
): WeeklyAction[] {
  const recommendations = getTopSkillRecommendations(userSkills, jobs, 2);

  const actions: WeeklyAction[] = recommendations.map(rec => ({
    id: `skill-${rec.skill}`,
    title: `Add ${rec.skill}`,
    detail: `High impact skill with strong demand and match upside.`,
    impact: 'high',
  }));

  const topJob = jobs
    .map(job => ({ ...job, match: getJobMatchScore(userSkills, job.required_skills) }))
    .sort((a, b) => b.match - a.match)[0];

  if (topJob && topJob.match < 100) {
    const missing = topJob.required_skills.filter(skill => !userSkills.includes(skill)).slice(0, 2);
    if (missing.length > 0) {
      actions.push({
        id: `job-gap-${topJob.role}`,
        title: `Close ${topJob.role} gap`,
        detail: `Focus on ${missing.join(', ')} to raise your match score faster.`,
        impact: 'high',
      });
    }
  }

  if (!hasFinancePlan) {
    actions.push({
      id: 'finance-baseline',
      title: 'Set your monthly budget',
      detail: 'Add income, expenses, and a savings goal to track career-to-money progress.',
      impact: 'medium',
    });
  }

  if (actions.length < 3) {
    const salary = calculateSalaryFromSkills(userSkills);
    actions.push({
      id: 'salary-review',
      title: 'Review salary trajectory',
      detail: `Current estimate is ${salary.estimated}. Re-check after adding one new skill this week.`,
      impact: 'medium',
    });
  }

  return actions.slice(0, 4);
}

export function buildPlanInsights(baseSkills: string[], planSkills: string[], jobs: JobRow[]) {
  const mergedSkills = [...new Set([...baseSkills, ...planSkills])];
  const salary = calculateSalaryFromSkills(mergedSkills);

  const topMatch = jobs.reduce((best, job) => {
    const match = getJobMatchScore(mergedSkills, job.required_skills);
    if (!best || match > best.match) {
      return { role: job.role, match };
    }
    return best;
  }, null as { role: string; match: number } | null);

  const avgMatch = jobs.length
    ? Math.round(jobs.reduce((sum, job) => sum + getJobMatchScore(mergedSkills, job.required_skills), 0) / jobs.length)
    : 0;

  return {
    mergedSkills,
    salary,
    topMatch,
    avgMatch,
  };
}
