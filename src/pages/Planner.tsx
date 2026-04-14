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
} from '@/lib/phase3';
import { CalendarCheck2, Siren, Rocket, Clock3, Flag, Search } from 'lucide-react';

function storageKey(userId: string, suffix: string): string {
  return `skillworth:phase3:${suffix}:${userId}`;
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

  const lastActiveIso = user?.id ? getStorageItem(storageKey(user.id, 'last-active')) : null;
  const nudges = buildActionNudges({
    milestones,
    lastActiveIso,
    weeklyHours,
    hasFinancePlan: Boolean(finance),
    readiness,
  });

  const visibleLearningPlan = useMemo(
    () =>
      learningPlan.filter(item =>
        sprintSearch.trim().length === 0
          ? true
          : item.skill.toLowerCase().includes(sprintSearch.trim().toLowerCase()),
      ),
    [learningPlan, sprintSearch],
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
      <section className="rounded-2xl border border-border/50 p-5 sm:p-7 bg-[linear-gradient(130deg,hsl(var(--simulation)/0.18),hsl(var(--career)/0.08))]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Execution Studio</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mt-2">Plan. Execute. Compound.</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
              Turn strategy into weekly movement with milestones, readiness gates, and live finance projections.
            </p>
          </div>

          <div className="w-full lg:w-[220px] rounded-xl border border-border/60 bg-card/85 p-3">
            <p className="text-[11px] text-muted-foreground">Weekly Learning Capacity</p>
            <Input
              className="mt-2"
              type="number"
              min={2}
              max={40}
              value={weeklyHours}
              onChange={e => setWeeklyHours(Math.max(2, Math.min(40, Number(e.target.value || 2))))}
            />
            <p className="text-[11px] text-muted-foreground mt-2">Pace adjusts due dates and recommendation intensity.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className="text-xl font-display font-bold mt-1">{completionRate}%</p>
            <Progress value={completionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Readiness</p>
            <p className="text-xl font-display font-bold mt-1">{readiness?.score || 0}%</p>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">{readiness?.role || 'No role selected'}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">3-Month Savings</p>
            <p className="text-xl font-display font-bold mt-1">{formatINR(projectedQuarterly?.cumulativeSavings || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Quarter target pulse</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">12-Month Savings</p>
            <p className="text-xl font-display font-bold mt-1">{formatINR(projectedYearly?.cumulativeSavings || 0)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Goal month: {projection.goalReachedMonth === null ? 'not reached' : projection.goalReachedMonth}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> Priority Skill Sprints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={sprintSearch}
                onChange={e => setSprintSearch(e.target.value)}
                placeholder="Search skill sprints"
                className="pl-9"
              />
            </div>

            {visibleLearningPlan.length === 0 && <p className="text-sm text-muted-foreground">No sprint matches found.</p>}

            {visibleLearningPlan.map(item => (
              <div key={item.skill} className="rounded-xl border border-border/60 p-4 bg-card/70">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">#{item.priority} {item.skill}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.recommendedHours}h total, {item.weeklyHoursTarget}h/week target
                    </p>
                  </div>
                  <Badge variant="secondary">+{formatINRCompact(item.estimatedSalaryBoost)}/yr</Badge>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.resources.slice(0, 2).map(resource => (
                    <a
                      key={`${item.skill}-${resource.title}`}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border/50 p-2 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs font-medium">{resource.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {resource.type} • {resource.difficulty} • {resource.estimatedHours}h
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" /> Readiness Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
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

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Siren className="w-5 h-5 text-primary" /> Smart Nudges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nudges.map(nudge => (
                <div key={nudge.id} className="rounded-lg border border-border/60 p-3">
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
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-primary" /> Milestone Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={milestoneSearch}
              onChange={e => setMilestoneSearch(e.target.value)}
              placeholder="Search milestones by title or skill"
              className="pl-9"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {groupedMilestones.map(column => (
              <div key={column.status} className="rounded-xl border border-border/60 p-3 bg-muted/20">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold capitalize">{column.status}</p>
                  <Badge variant="outline" className="text-[10px]">{column.items.length}</Badge>
                </div>

                <div className="space-y-2 min-h-[80px]">
                  {column.items.length === 0 && (
                    <p className="text-xs text-muted-foreground">No items</p>
                  )}

                  {column.items.map(milestone => (
                    <article key={milestone.id} className="rounded-lg border border-border/60 p-2 bg-card">
                      <p className="text-xs font-medium">{milestone.skill}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {new Date(milestone.dueDateIso).toLocaleDateString()} • {milestone.estimatedHours}h
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {statusColumns.map(status => (
                          <Button
                            key={`${milestone.id}-${status}`}
                            size="sm"
                            variant={milestone.status === status ? 'default' : 'outline'}
                            className="h-6 text-[10px] capitalize"
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
  );
}
