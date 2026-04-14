import { calculateSalaryFromSkills, getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import { getTopSkillRecommendations } from '@/lib/recommendations';
import type { JobRow } from '@/hooks/useJobs';

export type ResourceType = 'course' | 'project' | 'article';

export interface LearningResource {
  title: string;
  url: string;
  type: ResourceType;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningPlanItem {
  skill: string;
  priority: number;
  estimatedSalaryBoost: number;
  recommendedHours: number;
  weeklyHoursTarget: number;
  resources: LearningResource[];
}

export type MilestoneStatus = 'planned' | 'in-progress' | 'completed' | 'blocked';

export interface LearningMilestone {
  id: string;
  skill: string;
  title: string;
  dueDateIso: string;
  estimatedHours: number;
  status: MilestoneStatus;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface RoleReadiness {
  role: string;
  score: number;
  requiredCount: number;
  matchedRequiredCount: number;
  missingRequired: string[];
  readyToApply: boolean;
}

export interface FinanceProjectionPoint {
  month: number;
  projectedSalary: number;
  monthlySavings: number;
  cumulativeSavings: number;
}

export interface FinanceProjection {
  points: FinanceProjectionPoint[];
  goalReachedMonth: number | null;
}

export interface ActionNudge {
  id: string;
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SavedSimulationScenario {
  id: string;
  name: string;
  planASkills: string[];
  planBSkills: string[];
  createdAtIso: string;
}

const categoryResources: Record<string, LearningResource[]> = {
  frontend: [
    { title: 'Frontend Foundations', url: 'https://roadmap.sh/frontend', type: 'article', estimatedHours: 2, difficulty: 'beginner' },
    { title: 'Build a UI Clone Project', url: 'https://www.frontendmentor.io/challenges', type: 'project', estimatedHours: 8, difficulty: 'intermediate' },
  ],
  backend: [
    { title: 'Backend Learning Path', url: 'https://roadmap.sh/backend', type: 'article', estimatedHours: 2, difficulty: 'beginner' },
    { title: 'REST API Project', url: 'https://github.com/public-apis/public-apis', type: 'project', estimatedHours: 10, difficulty: 'intermediate' },
  ],
  devops: [
    { title: 'DevOps Roadmap', url: 'https://roadmap.sh/devops', type: 'article', estimatedHours: 2, difficulty: 'beginner' },
    { title: 'Containerized Deployment Project', url: 'https://docs.docker.com/get-started/', type: 'project', estimatedHours: 10, difficulty: 'intermediate' },
  ],
  cloud: [
    { title: 'Cloud Engineer Roadmap', url: 'https://roadmap.sh/devops', type: 'article', estimatedHours: 2, difficulty: 'beginner' },
    { title: 'Cloud Cost and Architecture Lab', url: 'https://learn.microsoft.com/training/', type: 'course', estimatedHours: 8, difficulty: 'intermediate' },
  ],
  database: [
    { title: 'Database Design Basics', url: 'https://www.postgresql.org/docs/current/tutorial.html', type: 'article', estimatedHours: 3, difficulty: 'beginner' },
    { title: 'Schema and Query Tuning Project', url: 'https://use-the-index-luke.com/', type: 'project', estimatedHours: 8, difficulty: 'intermediate' },
  ],
  default: [
    { title: 'Skill Sprint Plan', url: 'https://roadmap.sh', type: 'article', estimatedHours: 2, difficulty: 'beginner' },
    { title: 'Portfolio Proof Project', url: 'https://www.freecodecamp.org/news/', type: 'project', estimatedHours: 8, difficulty: 'intermediate' },
  ],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthFromNow(base: Date, monthOffset: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + monthOffset);
  return d;
}

function getResourcesForSkill(skill: string): LearningResource[] {
  const category = skillSalaryMap[skill]?.category || 'default';
  return categoryResources[category] || categoryResources.default;
}

export function buildLearningPlan(userSkills: string[], jobs: JobRow[], weeklyHours: number, limit = 4): LearningPlanItem[] {
  const effectiveWeeklyHours = clamp(Math.round(weeklyHours), 2, 40);
  const recommendations = getTopSkillRecommendations(userSkills, jobs, limit);

  return recommendations.map((recommendation, index) => {
    const recommendedHours = clamp(Math.round(recommendation.salaryBoost / 1800), 6, 24);
    const weeklyHoursTarget = clamp(Math.ceil(recommendedHours / 3), 2, effectiveWeeklyHours);
    return {
      skill: recommendation.skill,
      priority: index + 1,
      estimatedSalaryBoost: recommendation.salaryBoost,
      recommendedHours,
      weeklyHoursTarget,
      resources: getResourcesForSkill(recommendation.skill),
    };
  });
}

export function buildMilestonesFromPlan(
  learningPlan: LearningPlanItem[],
  weeklyHours: number,
  startDate = new Date(),
): LearningMilestone[] {
  const pace = clamp(Math.round(weeklyHours), 2, 40);
  let runningDays = 0;

  return learningPlan.map(plan => {
    const estimatedWeeks = Math.max(1, Math.ceil(plan.recommendedHours / pace));
    runningDays += estimatedWeeks * 7;
    const nowIso = new Date().toISOString();

    return {
      id: `milestone-${plan.skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      skill: plan.skill,
      title: `Complete ${plan.skill} sprint`,
      dueDateIso: addDays(startDate, runningDays).toISOString(),
      estimatedHours: plan.recommendedHours,
      status: 'planned',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
  });
}

export function mergeMilestones(existing: LearningMilestone[], generated: LearningMilestone[]): LearningMilestone[] {
  const existingBySkill = new Map(existing.map(m => [m.skill, m]));
  return generated.map(m => {
    const current = existingBySkill.get(m.skill);
    if (!current) return m;
    return {
      ...m,
      status: current.status,
      createdAtIso: current.createdAtIso,
      updatedAtIso: current.updatedAtIso,
      dueDateIso: current.dueDateIso,
    };
  });
}

export function getRoleReadiness(userSkills: string[], targetJob: JobRow | null): RoleReadiness | null {
  if (!targetJob) return null;

  const matchedRequired = targetJob.required_skills.filter(skill => userSkills.includes(skill));
  const missingRequired = targetJob.required_skills.filter(skill => !userSkills.includes(skill));
  const score = getJobMatchScore(userSkills, targetJob.required_skills);

  return {
    role: targetJob.role,
    score,
    requiredCount: targetJob.required_skills.length,
    matchedRequiredCount: matchedRequired.length,
    missingRequired,
    readyToApply: score >= 80 && missingRequired.length <= 1,
  };
}

export function buildFinanceProjection(params: {
  baseSkills: string[];
  milestones: LearningMilestone[];
  baseMonthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  goalAmount: number;
  months?: number;
  now?: Date;
}): FinanceProjection {
  const {
    baseSkills,
    milestones,
    baseMonthlyIncome,
    monthlyExpenses,
    currentSavings,
    goalAmount,
    months = 12,
    now = new Date(),
  } = params;

  const points: FinanceProjectionPoint[] = [];
  const completedSkillSet = new Set(baseSkills);
  let cumulativeSavings = currentSavings;
  let goalReachedMonth: number | null = currentSavings >= goalAmount ? 0 : null;

  for (let month = 1; month <= months; month += 1) {
    const checkpoint = monthFromNow(now, month);
    milestones.forEach(m => {
      if (new Date(m.dueDateIso) <= checkpoint && m.status !== 'blocked') {
        completedSkillSet.add(m.skill);
      }
    });

    const salaryModel = calculateSalaryFromSkills(Array.from(completedSkillSet));
    const projectedSalary = Math.max(baseMonthlyIncome, salaryModel.estimated);
    const monthlySavings = Math.max(0, projectedSalary - monthlyExpenses);
    cumulativeSavings += monthlySavings;

    if (goalReachedMonth === null && cumulativeSavings >= goalAmount) {
      goalReachedMonth = month;
    }

    points.push({
      month,
      projectedSalary,
      monthlySavings,
      cumulativeSavings,
    });
  }

  return { points, goalReachedMonth };
}

export function buildActionNudges(params: {
  milestones: LearningMilestone[];
  lastActiveIso: string | null;
  weeklyHours: number;
  hasFinancePlan: boolean;
  readiness: RoleReadiness | null;
}): ActionNudge[] {
  const { milestones, lastActiveIso, weeklyHours, hasFinancePlan, readiness } = params;
  const nudges: ActionNudge[] = [];
  const today = new Date();

  const overdue = milestones.filter(m => new Date(m.dueDateIso) < today && m.status !== 'completed');
  if (overdue.length > 0) {
    nudges.push({
      id: 'overdue-milestones',
      title: 'Milestone recovery',
      message: `${overdue.length} learning milestone${overdue.length > 1 ? 's are' : ' is'} overdue. Re-plan due dates to keep momentum.`,
      severity: 'high',
    });
  }

  if (lastActiveIso) {
    const inactiveDays = Math.floor((today.getTime() - new Date(lastActiveIso).getTime()) / (1000 * 60 * 60 * 24));
    if (inactiveDays >= 7) {
      nudges.push({
        id: 'inactive-user',
        title: 'Resume your cadence',
        message: `No updates for ${inactiveDays} days. Even a 30-minute study session restores consistency.`,
        severity: 'medium',
      });
    }
  }

  if (weeklyHours < 4) {
    nudges.push({
      id: 'capacity-low',
      title: 'Increase weekly capacity',
      message: 'Your plan pace is conservative. Raising capacity by 1-2 hours can pull milestones forward.',
      severity: 'low',
    });
  }

  if (!hasFinancePlan) {
    nudges.push({
      id: 'missing-finance-plan',
      title: 'Connect goals to money',
      message: 'Set a finance plan to see when skill gains can reach your savings target.',
      severity: 'medium',
    });
  }

  if (readiness && !readiness.readyToApply && readiness.missingRequired.length > 0) {
    nudges.push({
      id: 'readiness-gap',
      title: `Close ${readiness.role} gaps`,
      message: `Prioritize ${readiness.missingRequired.slice(0, 2).join(', ')} to improve application readiness.`,
      severity: 'high',
    });
  }

  if (nudges.length === 0) {
    nudges.push({
      id: 'on-track',
      title: 'You are on track',
      message: 'Keep this weekly rhythm and review your plan every Sunday.',
      severity: 'low',
    });
  }

  return nudges.slice(0, 4);
}
