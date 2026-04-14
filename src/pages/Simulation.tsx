import { useEffect, useState } from 'react';
import { useUserSkills, useAllSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlaskConical, Plus, X, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR, formatINRCompact } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';
import { buildPlanInsights } from '@/lib/phase2';
import { getStorageJson, setStorageJson } from '@/lib/local-storage';
import type { SavedSimulationScenario } from '@/lib/phase3';
import { useAuth } from '@/contexts/AuthContext';

export default function Simulation() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: allSkills = [], isLoading: allSkillsLoading, error: allSkillsError } = useAllSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const [planASkills, setPlanASkills] = useState<string[]>([]);
  const [planBSkills, setPlanBSkills] = useState<string[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [savedScenarios, setSavedScenarios] = useState<SavedSimulationScenario[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setSavedScenarios([]);
      return;
    }
    const key = `skillworth:phase3:scenarios:${user.id}`;
    setSavedScenarios(getStorageJson<SavedSimulationScenario[]>(key, []));
  }, [user?.id]);

  const persistScenarios = (next: SavedSimulationScenario[]) => {
    if (!user?.id) return;
    const key = `skillworth:phase3:scenarios:${user.id}`;
    setSavedScenarios(next);
    setStorageJson(key, next);
  };

  const saveScenario = () => {
    if (!user?.id || (!planASkills.length && !planBSkills.length)) return;

    const scenario: SavedSimulationScenario = {
      id: `${Date.now()}`,
      name: scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`,
      planASkills,
      planBSkills,
      createdAtIso: new Date().toISOString(),
    };

    const next = [scenario, ...savedScenarios].slice(0, 8);
    persistScenarios(next);
    setScenarioName('');
  };

  const loadScenario = (scenario: SavedSimulationScenario) => {
    setPlanASkills(scenario.planASkills);
    setPlanBSkills(scenario.planBSkills);
  };

  const deleteScenario = (id: string) => {
    persistScenarios(savedScenarios.filter(s => s.id !== id));
  };

  if (userSkillsLoading || allSkillsLoading || jobsLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading simulation"
          description="Collecting skills and jobs for your scenario..."
        />
      </div>
    );
  }

  if (userSkillsError || allSkillsError || jobsError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load simulation"
          description="Please refresh and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const currentSkillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];
  const baseInsights = buildPlanInsights(currentSkillNames, [], jobs);
  const planAInsights = buildPlanInsights(currentSkillNames, planASkills, jobs);
  const planBInsights = buildPlanInsights(currentSkillNames, planBSkills, jobs);

  const availablePlanA = allSkills
    .filter(s => !currentSkillNames.includes(s.name) && !planASkills.includes(s.name))
    .sort((a, b) => (skillSalaryMap[b.name]?.salaryBoost || 0) - (skillSalaryMap[a.name]?.salaryBoost || 0));

  const availablePlanB = allSkills
    .filter(s => !currentSkillNames.includes(s.name) && !planBSkills.includes(s.name))
    .sort((a, b) => (skillSalaryMap[b.name]?.salaryBoost || 0) - (skillSalaryMap[a.name]?.salaryBoost || 0));

  const comparisonData = jobs.slice(0, isMobile ? 5 : 8).map(j => ({
    role: j.role.length > 20 ? j.role.slice(0, 18) + '…' : j.role,
    current: getJobMatchScore(currentSkillNames, j.required_skills),
    planA: getJobMatchScore(planAInsights.mergedSkills, j.required_skills),
    planB: getJobMatchScore(planBInsights.mergedSkills, j.required_skills),
  }));

  const planASalaryGain = planAInsights.salary.estimated - baseInsights.salary.estimated;
  const planBSalaryGain = planBInsights.salary.estimated - baseInsights.salary.estimated;
  const planAAvgGain = planAInsights.avgMatch - baseInsights.avgMatch;
  const planBAvgGain = planBInsights.avgMatch - baseInsights.avgMatch;

  const hasPlanData = planASkills.length > 0 || planBSkills.length > 0;

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Growth Simulation</h1>
          <p className="text-muted-foreground mt-1">"What if" scenario — see how new skills impact your career</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2"><FlaskConical className="w-5 h-5 text-simulation" /> Build Compare Plans</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Plan A</h3>
              <span className="text-xs text-muted-foreground">{planASkills.length}/5 skills</span>
            </div>
            <div className="flex flex-wrap gap-2 min-h-8">
              {planASkills.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPlanASkills(planASkills.filter(x => x !== s))}>
                  {s} <X className="w-3 h-3" />
                </Badge>
              ))}
              {planASkills.length === 0 && <p className="text-xs text-muted-foreground">Add skills for option A</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availablePlanA.slice(0, 10).map(s => (
                <Button
                  key={`a-${s.id}`}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setPlanASkills(prev => (prev.length < 5 ? [...prev, s.name] : prev))}
                  disabled={planASkills.length >= 5}
                >
                  <Plus className="w-3 h-3 mr-1" /> {s.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Plan B</h3>
              <span className="text-xs text-muted-foreground">{planBSkills.length}/5 skills</span>
            </div>
            <div className="flex flex-wrap gap-2 min-h-8">
              {planBSkills.map(s => (
                <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPlanBSkills(planBSkills.filter(x => x !== s))}>
                  {s} <X className="w-3 h-3" />
                </Badge>
              ))}
              {planBSkills.length === 0 && <p className="text-xs text-muted-foreground">Add skills for option B</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availablePlanB.slice(0, 10).map(s => (
                <Button
                  key={`b-${s.id}`}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setPlanBSkills(prev => (prev.length < 5 ? [...prev, s.name] : prev))}
                  disabled={planBSkills.length >= 5}
                >
                  <Plus className="w-3 h-3 mr-1" /> {s.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-display">Saved Scenarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Name this scenario"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
            />
            <Button onClick={saveScenario} disabled={!planASkills.length && !planBSkills.length}>
              Save Scenario
            </Button>
          </div>

          {savedScenarios.length === 0 && (
            <p className="text-xs text-muted-foreground">No saved scenarios yet. Save your first Plan A vs Plan B setup.</p>
          )}

          {savedScenarios.map(scenario => (
            <div key={scenario.id} className="rounded-lg border border-border/60 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{scenario.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  A: {scenario.planASkills.join(', ') || 'None'} | B: {scenario.planBSkills.join(', ') || 'None'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => loadScenario(scenario)}>Load</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteScenario(scenario.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {hasPlanData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Current baseline</p>
                <p className="text-xl font-display font-bold">{formatINR(baseInsights.salary.estimated)}</p>
                <p className="text-xs text-muted-foreground">Avg match: {baseInsights.avgMatch}%</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Plan A forecast</p>
                <p className="text-xl font-display font-bold">{formatINR(planAInsights.salary.estimated)}</p>
                <p className="text-xs text-primary">+{formatINR(planASalaryGain)} | +{planAAvgGain}% avg match</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Plan B forecast</p>
                <p className="text-xl font-display font-bold">{formatINR(planBInsights.salary.estimated)}</p>
                <p className="text-xs text-primary">+{formatINR(planBSalaryGain)} | +{planBAvgGain}% avg match</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Role Match Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: isMobile ? 10 : 11 }} />
                      <YAxis dataKey="role" type="category" width={isMobile ? 88 : 120} tick={{ fontSize: isMobile ? 9 : 10 }} />
                      <Tooltip />
                      {!isMobile && <Legend />}
                      <Bar dataKey="current" name="Current" fill="hsl(220,10%,70%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="planA" name="Plan A" fill="hsl(160,84%,39%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="planB" name="Plan B" fill="hsl(262,83%,58%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Decision Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Recommended plan</p>
                  <p className="text-sm font-semibold mt-1">
                    {planASalaryGain + planAAvgGain >= planBSalaryGain + planBAvgGain ? 'Plan A' : 'Plan B'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected by combined salary growth and role match uplift.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">Top role outcomes</p>
                  <p className="text-xs text-muted-foreground mt-1">Current: {baseInsights.topMatch?.role || 'N/A'} ({baseInsights.topMatch?.match || 0}%)</p>
                  <p className="text-xs text-muted-foreground">Plan A: {planAInsights.topMatch?.role || 'N/A'} ({planAInsights.topMatch?.match || 0}%)</p>
                  <p className="text-xs text-muted-foreground">Plan B: {planBInsights.topMatch?.role || 'N/A'} ({planBInsights.topMatch?.match || 0}%)</p>
                </div>

                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Estimated monthly gain</p>
                  <p className="text-xs text-muted-foreground mt-1">Plan A: +{formatINRCompact(Math.round(planASalaryGain / 12))}</p>
                  <p className="text-xs text-muted-foreground">Plan B: +{formatINRCompact(Math.round(planBSalaryGain / 12))}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!hasPlanData && (
        <Card className="border-border/50">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Add skills into Plan A or Plan B to compare salary growth and job-match outcomes.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
