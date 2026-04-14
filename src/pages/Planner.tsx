import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import { useFinance } from '@/hooks/useFinance';
import { useUserSkills } from '@/hooks/useUserSkills';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { StatePanel } from '@/components/ui/state-panel';
import { formatINR, formatINRCompact } from '@/lib/currency';
import { getStorageJson, getStorageItem, setStorageJson, setStorageItem } from '@/lib/local-storage';
import {
  buildActionNudges,
  buildFinanceProjection,
  buildLearningPlan,
  buildMilestonesFromPlan,
  getRoleReadiness,
  mergeMilestones,
  type LearningMilestone,
  type MilestoneStatus,
} from '@/lib/career-roadmap';
import { buildAdaptiveLearningPlan } from '@/lib/adaptive-planner';
import { CalendarCheck2, Siren, Rocket, Clock3, Flag, Search } from 'lucide-react';

function storageKey(userId: string, suffix: string): string {
  return `skillworth:planner:${suffix}:${userId}`;
}

const statusColumns: MilestoneStatus[] = ['planned', 'in-progress', 'completed', 'blocked'];

export default function Planner() {
  const { user } = useAuth();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const { data: finance, isLoading: financeLoading, error: financeError } = useFinance();

  const [weeklyHours, setWeeklyHours] = useState(6);
  const [milestones, setMilestones] = useState<LearningMilestone[]>([]);
  const [targetRoleId, setTargetRoleId] = useState<string>('');
  const [sprintSearch, setSprintSearch] = useState('');
  const [milestoneSearch, setMilestoneSearch] = useState('');

  const skillNames = useMemo(
    () => userSkills.map(us => us.skills?.name).filter(Boolean) as string[],
    [userSkills],
  );

  const learningPlan = useMemo(
    () => buildLearningPlan(skillNames, jobs, weeklyHours, 5),
    [skillNames, jobs, weeklyHours],
  );

  useEffect(() => {
    if (!user?.id) return;

    const hoursKey = storageKey(user.id, 'weekly-hours');
    const targetKey = storageKey(user.id, 'target-role');
    const storedHours = getStorageItem(hoursKey);
    const storedRole = getStorageItem(targetKey);

    if (storedHours) {
      const parsed = Number(storedHours);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setWeeklyHours(parsed);
      }
    }

    if (storedRole) {
      setTargetRoleId(storedRole);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setStorageItem(storageKey(user.id, 'weekly-hours'), String(weeklyHours));
  }, [weeklyHours, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setStorageItem(storageKey(user.id, 'target-role'), targetRoleId);
  }, [targetRoleId, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const milestonesKey = storageKey(user.id, 'milestones');
    const existing = getStorageJson<LearningMilestone[]>(milestonesKey, []);
    const generated = buildMilestonesFromPlan(learningPlan, weeklyHours);
    const merged = mergeMilestones(existing, generated);

    setMilestones(merged);
    setStorageJson(milestonesKey, merged);
  }, [learningPlan, weeklyHours, user?.id]);

  useEffect(() => {
    if (!user?.id || milestones.length === 0) return;
    setStorageJson(storageKey(user.id, 'milestones'), milestones);
  }, [milestones, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setStorageItem(storageKey(user.id, 'last-active'), new Date().toISOString());
  }, [milestones, weeklyHours, user?.id]);

  const lastActiveIso = user?.id
    ? getStorageItem(storageKey(user.id, 'last-active'))
    : null;

  if (userSkillsLoading || jobsLoading || financeLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading execution studio"
          description="Compiling milestones, readiness, and money forecasts..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError || financeError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load planner"
          description="Please refresh and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const selectedJob = jobs.find(job => job.id === targetRoleId) || jobs[0] || null;
  const readiness = getRoleReadiness(skillNames, selectedJob);
  const adaptivePlan = useMemo(
    () =>
      buildAdaptiveLearningPlan({
        learningPlan,
        milestones,
        weeklyHours,
        lastActiveIso,
        readiness,
        hasFinancePlan: Boolean(finance),
      }),
    [finance, learningPlan, lastActiveIso, milestones, readiness, weeklyHours],
  );

  const completedMilestones = milestones.filter(milestone => milestone.status === 'completed').length;
  const completionRate = milestones.length === 0 ? 0 : Math.round((completedMilestones / milestones.length) * 100);

  const expenses = finance?.expenses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const projection = buildFinanceProjection({
    baseSkills: skillNames,
    milestones,
    baseMonthlyIncome: finance?.income || 0,
    monthlyExpenses: expenses,
    currentSavings: finance?.savings || 0,
    goalAmount: finance?.goal_amount || 0,
    months: 12,
  });

  const projectedQuarterly = projection.points[2] || projection.points[projection.points.length - 1];
  const projectedYearly = projection.points[11] || projection.points[projection.points.length - 1];

  const nudges = buildActionNudges({
    milestones,
    lastActiveIso,
    weeklyHours,
    hasFinancePlan: Boolean(finance),
    readiness,
  });

  const visibleLearningPlan = useMemo(
    () =>
      adaptivePlan.items.filter(item =>
        sprintSearch.trim().length === 0
          ? true
          : item.skill.toLowerCase().includes(sprintSearch.trim().toLowerCase()),
      ),
    [adaptivePlan.items, sprintSearch],
  );

  const groupedMilestones = statusColumns.map(status => ({
    status,
    items: milestones.filter(milestone => {
      if (milestone.status !== status) return false;
      if (milestoneSearch.trim().length === 0) return true;
      const query = milestoneSearch.trim().toLowerCase();
      return (
        milestone.skill.toLowerCase().includes(query)
        || milestone.title.toLowerCase().includes(query)
      );
    }),
  }));

  const statusSummaries = statusColumns.map(status => ({
    status,
    count: groupedMilestones.find(column => column.status === status)?.items.length || 0,
  }));

  const topSprintCards = visibleLearningPlan.slice(0, 3);
  const visibleNudges = nudges.slice(0, 3);
  const milestoneCoverage = milestones.length === 0 ? 0 : Math.round((completedMilestones / milestones.length) * 100);
  const cadenceLabel = adaptivePlan.summary.cadenceLabel;

  const planSignals = [
    {
      label: 'Completion',
      value: `${milestoneCoverage}%`,
      detail: `${completedMilestones}/${milestones.length || 0} milestones complete`,
    },
    {
      label: 'Readiness',
      value: `${readiness?.score || 0}%`,
      detail: readiness?.role || 'No role selected',
    },
    {
      label: 'Cadence',
      value: cadenceLabel,
      detail: `${weeklyHours}h per week targeted`,
    },
    {
      label: 'Savings pulse',
      value: formatINR(projectedQuarterly?.cumulativeSavings || 0),
      detail: `12-month goal month: ${projection.goalReachedMonth === null ? 'not reached' : projection.goalReachedMonth}`,
    },
  ];

  const setMilestoneStatus = (id: string, status: MilestoneStatus) => {
    setMilestones(prev =>
      prev.map(milestone =>
        milestone.id === id
          ? {
              ...milestone,
              status,
              updatedAtIso: new Date().toISOString(),
            }
          : milestone,
      ),
    );
  };

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Execution Studio</Badge>
              <Badge variant={adaptivePlan.summary.needsReset ? 'default' : 'secondary'} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
                {adaptivePlan.summary.needsReset ? 'Reset needed' : 'Stable cadence'}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Plan the week, not just the goal.</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl">
              Build a weekly execution system that keeps learning, role readiness, and savings moving together.
            </p>
          </div>

          <div className="w-full lg:w-[260px] rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Weekly learning capacity</p>
                <p className="text-sm font-medium mt-1">Tune your planning pace</p>
              </div>
              <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground shadow-sm">
                <Rocket className="h-4 w-4" />
              </div>
            </div>
            <Input
              className="mt-4 h-11 rounded-xl"
              type="number"
              min={2}
              max={40}
              value={weeklyHours}
              onChange={e => setWeeklyHours(Math.max(2, Math.min(40, Number(e.target.value || 2))))}
            />
            <p className="text-[11px] text-muted-foreground mt-3">
              Pace adjusts due dates, urgency, and the size of each sprint.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planSignals.map(signal => (
          <Card key={signal.label} className="panel-soft">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{signal.label}</p>
              <p className="text-2xl font-display font-bold mt-2">{signal.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{signal.detail}</p>
              {signal.label === 'Completion' && <Progress value={milestoneCoverage} className="h-1.5 mt-3" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="panel-soft">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Planner health</p>
              <h2 className="text-lg font-display font-bold mt-1">Execution signal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The planner adapts weekly around momentum, blockers, and job readiness.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={adaptivePlan.summary.needsReset ? 'default' : 'secondary'}>
                {adaptivePlan.summary.needsReset ? 'Needs reset' : 'On track'}
              </Badge>
              <Badge variant="outline">Cadence: {adaptivePlan.summary.cadenceLabel}</Badge>
              <Badge variant="outline">Overdue: {adaptivePlan.summary.overdueCount}</Badge>
              <Badge variant="outline">Blocked: {adaptivePlan.summary.blockedCount}</Badge>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Top priority</p>
              <p className="text-sm font-medium mt-2">{adaptivePlan.summary.topPrioritySkill || 'No active skill'}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Idle days</p>
              <p className="text-sm font-medium mt-2">
                {adaptivePlan.summary.idleDays === null ? 'No activity stamp' : `${adaptivePlan.summary.idleDays} day${adaptivePlan.summary.idleDays === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Reset trigger</p>
              <p className="text-sm font-medium mt-2">{adaptivePlan.summary.needsReset ? 'Replan this week' : 'Keep the current sequence'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" /> Focus Stack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={sprintSearch}
                  onChange={e => setSprintSearch(e.target.value)}
                  placeholder="Search skills, gaps, or targets"
                  className="pl-9 h-11 rounded-xl"
                />
              </div>

              {visibleLearningPlan.length === 0 && <p className="text-sm text-muted-foreground">No sprint matches found.</p>}

              <div className="grid gap-4 lg:grid-cols-3">
                {topSprintCards.map(item => (
                  <article key={item.skill} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Priority {item.priority}</p>
                        <h3 className="text-base font-semibold mt-2">{item.skill}</h3>
                      </div>
                      <Badge variant={item.status === 'blocked' ? 'default' : 'secondary'} className="capitalize">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{item.recommendedHours}h total</span>
                      <span>{item.weeklyHoursTarget}h/week target</span>
                    </div>
                    <Progress value={Math.min(100, Math.round(item.urgencyScore))} className="h-1.5 mt-3" />

                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{item.focusReason}</p>
                    <p className="text-xs mt-2 leading-relaxed">{item.nextStep}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">{Math.round(item.urgencyScore)} urgency</Badge>
                      <Badge variant="secondary">+{formatINRCompact(item.estimatedSalaryBoost)}/yr</Badge>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {item.resources.slice(0, 2).map(resource => (
                        <a
                          key={`${item.skill}-${resource.title}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-border/50 p-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-xs font-medium">{resource.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {resource.type} • {resource.difficulty} • {resource.estimatedHours}h
                          </p>
                        </a>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {statusSummaries.map(column => (
                  <div key={column.status} className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground capitalize">{column.status}</p>
                    <p className="text-2xl font-display font-bold mt-2">{column.count}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Milestones in this lane</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-primary" /> Milestone Board
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={milestoneSearch}
                onChange={e => setMilestoneSearch(e.target.value)}
                placeholder="Search milestones by title or skill"
                className="pl-9"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {groupedMilestones.map(column => (
                <div key={column.status} className="rounded-2xl border border-border/60 p-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm font-semibold capitalize">{column.status}</p>
                    <Badge variant="outline" className="text-[10px]">{column.items.length}</Badge>
                  </div>

                  <div className="space-y-2 min-h-[80px]">
                    {column.items.length === 0 && (
                      <p className="text-xs text-muted-foreground">No items</p>
                    )}

                    {column.items
                      .filter(milestone => {
                        if (milestoneSearch.trim().length === 0) return true;
                        const query = milestoneSearch.trim().toLowerCase();
                        return milestone.skill.toLowerCase().includes(query) || milestone.title.toLowerCase().includes(query);
                      })
                      .map(milestone => (
                        <article key={milestone.id} className="rounded-xl border border-border/60 p-3 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{milestone.skill}</p>
                              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock3 className="w-3 h-3" />
                                {new Date(milestone.dueDateIso).toLocaleDateString()} • {milestone.estimatedHours}h
                              </p>
                            </div>
                            <Badge variant={milestone.status === 'blocked' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                              {milestone.status}
                            </Badge>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-1">
                            {statusColumns.map(status => (
                              <Button
                                key={`${milestone.id}-${status}`}
                                size="sm"
                                variant={milestone.status === status ? 'default' : 'outline'}
                                className="h-6 text-[10px] capitalize hover-glow"
                                onClick={() => setMilestoneStatus(milestone.id, status)}
                              >
                                {status}
                              </Button>
                            ))}
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="panel-soft hover-glow">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" /> Readiness Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                aria-label="Select target role"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                value={selectedJob?.id || ''}
                onChange={e => setTargetRoleId(e.target.value)}
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.role}</option>
                ))}
              </select>

              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-sm font-semibold">{readiness?.role || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {readiness?.matchedRequiredCount || 0}/{readiness?.requiredCount || 0} must-haves matched
                </p>
                <Progress value={readiness?.score || 0} className="h-1.5 mt-2" />
                <p className="text-xs mt-2">
                  {readiness?.readyToApply ? 'Ready to apply now' : 'Need additional proof before applying'}
                </p>
              </div>

              {readiness && readiness.missingRequired.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {readiness.missingRequired.map(skill => (
                    <Badge key={skill} variant="outline" className="text-[10px]">missing {skill}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Siren className="w-5 h-5 text-primary" /> Smart Nudges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visibleNudges.map(nudge => (
                <div key={nudge.id} className="rounded-2xl border border-border/60 bg-muted/25 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{nudge.title}</p>
                    <Badge variant={nudge.severity === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                      {nudge.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{nudge.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
