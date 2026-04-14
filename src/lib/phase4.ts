import type { RoleReadiness, LearningMilestone, LearningPlanItem, MilestoneStatus } from '@/lib/phase3';

export type AdaptivePlanStatus = MilestoneStatus | 'untracked';

export interface AdaptivePlanItem extends LearningPlanItem {
  milestone: LearningMilestone | null;
  status: AdaptivePlanStatus;
  daysUntilDue: number | null;
  urgencyScore: number;
  focusReason: string;
  nextStep: string;
}

export interface AdaptivePlannerSummary {
  topPrioritySkill: string | null;
  overdueCount: number;
  blockedCount: number;
  idleDays: number | null;
  cadenceLabel: 'light' | 'steady' | 'intense';
  needsReset: boolean;
}

function daysBetween(now: Date, iso: string): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function cadenceLabel(weeklyHours: number): 'light' | 'steady' | 'intense' {
  if (weeklyHours < 4) return 'light';
  if (weeklyHours < 8) return 'steady';
  return 'intense';
}

function buildReason(params: {
  status: AdaptivePlanStatus;
  dueDateIso: string | null;
  weeklyHours: number;
  weeklyHoursTarget: number;
  readiness: RoleReadiness | null;
  skill: string;
  idleDays: number | null;
}): string {
  const { status, dueDateIso, weeklyHours, weeklyHoursTarget, readiness, skill, idleDays } = params;

  if (status === 'blocked') return 'Blocked milestone needs a reset before it can move again.';
  if (readiness?.missingRequired.includes(skill)) return `Closes a gap for ${readiness.role}.`;
  if (dueDateIso && daysBetween(new Date(), dueDateIso) > 0) return 'Overdue milestone should be pulled back into this week.';
  if (weeklyHours < weeklyHoursTarget) return 'Weekly capacity is below the recommended pace for this sprint.';
  if (idleDays !== null && idleDays >= 7) return 'A long pause means this skill should be reactivated first.';
  if (status === 'in-progress') return 'Already moving, so finishing this skill gives the quickest payoff.';
  if (status === 'planned') return 'A planned skill is the easiest next win to start this week.';
  return 'No milestone exists yet, so this skill needs a first sprint.';
}

function buildNextStep(status: AdaptivePlanStatus, overdue: boolean): string {
  if (status === 'blocked') return 'Remove blockers and reorder the sprint.';
  if (overdue) return 'Move this to the top of the weekly plan.';
  if (status === 'in-progress') return 'Finish the remaining hours and mark completion.';
  if (status === 'planned') return 'Start with one focused study block.';
  return 'Create the first milestone for this skill.';
}

export function buildAdaptiveLearningPlan(params: {
  learningPlan: LearningPlanItem[];
  milestones: LearningMilestone[];
  weeklyHours: number;
  lastActiveIso: string | null;
  readiness: RoleReadiness | null;
  hasFinancePlan: boolean;
}): { items: AdaptivePlanItem[]; summary: AdaptivePlannerSummary } {
  const { learningPlan, milestones, weeklyHours, lastActiveIso, readiness, hasFinancePlan } = params;
  const now = new Date();
  const milestoneBySkill = new Map(milestones.map(milestone => [milestone.skill, milestone]));
  const idleDays = lastActiveIso ? daysBetween(now, lastActiveIso) : null;

  const items = learningPlan
    .map(item => {
      const milestone = milestoneBySkill.get(item.skill) || null;
      const status: AdaptivePlanStatus = milestone?.status || 'untracked';
      const dueDate = milestone ? new Date(milestone.dueDateIso) : null;
      const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const overdue = daysUntilDue !== null && daysUntilDue < 0;

      let urgencyScore = 40 - item.priority * 4;

      if (status === 'completed') urgencyScore -= 50;
      if (status === 'blocked') urgencyScore += 35;
      if (status === 'in-progress') urgencyScore += 18;
      if (status === 'planned') urgencyScore += 12;
      if (status === 'untracked') urgencyScore += 16;

      if (overdue) urgencyScore += 28;
      else if (daysUntilDue !== null && daysUntilDue <= 7) urgencyScore += 18;
      else if (daysUntilDue !== null && daysUntilDue <= 14) urgencyScore += 8;

      if (weeklyHours < item.weeklyHoursTarget) urgencyScore += 12;
      if (readiness?.missingRequired.includes(item.skill)) urgencyScore += 25;
      if (idleDays !== null && idleDays >= 7) urgencyScore += 8;
      if (!hasFinancePlan) urgencyScore += 4;

      return {
        ...item,
        milestone,
        status,
        daysUntilDue,
        urgencyScore,
        focusReason: buildReason({
          status,
          dueDateIso: milestone?.dueDateIso || null,
          weeklyHours,
          weeklyHoursTarget: item.weeklyHoursTarget,
          readiness,
          skill: item.skill,
          idleDays,
        }),
        nextStep: buildNextStep(status, overdue),
      };
    })
    .filter(item => item.status !== 'completed')
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.priority - b.priority);

  const overdueCount = items.filter(item => item.daysUntilDue !== null && item.daysUntilDue < 0).length;
  const blockedCount = items.filter(item => item.status === 'blocked').length;

  return {
    items,
    summary: {
      topPrioritySkill: items[0]?.skill || null,
      overdueCount,
      blockedCount,
      idleDays,
      cadenceLabel: cadenceLabel(weeklyHours),
      needsReset: overdueCount > 0 || blockedCount > 0 || (idleDays !== null && idleDays >= 7),
    },
  };
}