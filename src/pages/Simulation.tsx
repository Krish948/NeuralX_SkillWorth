import { useState } from 'react';
import { useUserSkills, useAllSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { calculateSalaryFromSkills, getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlaskConical, Plus, X, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR, formatINRCompact, formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

export default function Simulation() {
  const isMobile = useIsMobile();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: allSkills = [], isLoading: allSkillsLoading, error: allSkillsError } = useAllSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const [simSkills, setSimSkills] = useState<string[]>([]);

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
  const combinedSkills = [...new Set([...currentSkillNames, ...simSkills])];

  const currentSalary = calculateSalaryFromSkills(currentSkillNames);
  const simSalary = calculateSalaryFromSkills(combinedSkills);
  const salaryIncrease = simSalary.estimated - currentSalary.estimated;

  const availableToSim = allSkills
    .filter(s => !currentSkillNames.includes(s.name) && !simSkills.includes(s.name))
    .sort((a, b) => (skillSalaryMap[b.name]?.salaryBoost || 0) - (skillSalaryMap[a.name]?.salaryBoost || 0));

  const comparisonData = jobs.slice(0, isMobile ? 5 : 8).map(j => ({
    role: j.role.length > 20 ? j.role.slice(0, 18) + '…' : j.role,
    current: getJobMatchScore(currentSkillNames, j.required_skills),
    simulated: getJobMatchScore(combinedSkills, j.required_skills),
  }));

  const newJobMatches = jobs
    .map(j => ({
      ...j,
      currentMatch: getJobMatchScore(currentSkillNames, j.required_skills),
      simMatch: getJobMatchScore(combinedSkills, j.required_skills),
    }))
    .filter(j => j.simMatch > j.currentMatch)
    .sort((a, b) => (b.simMatch - b.currentMatch) - (a.simMatch - a.currentMatch))
    .slice(0, 5);

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
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-simulation" /> Add Skills to Simulate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {simSkills.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSimSkills(simSkills.filter(x => x !== s))}>
                {s} <X className="w-3 h-3" />
              </Badge>
            ))}
            {simSkills.length === 0 && <p className="text-sm text-muted-foreground">Click skills below to add them to your simulation</p>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableToSim.slice(0, 20).map(s => (
              <Button key={s.id} variant="outline" size="sm" className="text-xs h-7" onClick={() => setSimSkills([...simSkills, s.name])}>
                <Plus className="w-3 h-3 mr-1" /> {s.name}
                <span className="ml-1 text-primary">+{formatINRCompact(skillSalaryMap[s.name]?.salaryBoost || 0)}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {simSkills.length > 0 && (
        <>
          {/* Salary comparison */}
          <Card className="border-border/50 gradient-simulation text-simulation-foreground">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm opacity-80">Current Estimated Salary</p>
                <p className="text-2xl font-display font-bold">{formatINR(currentSalary.estimated)}/yr</p>
              </div>
              <ArrowRight className="w-6 h-6 opacity-60 hidden sm:block" />
              <div className="text-center sm:text-right">
                <p className="text-sm opacity-80">Simulated Salary</p>
                <p className="text-2xl font-display font-bold">{formatINR(simSalary.estimated)}/yr</p>
              </div>
              <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm sm:text-base px-3 sm:px-4 py-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +{formatINR(salaryIncrease)}
              </Badge>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">Job Match Comparison</CardTitle>
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
                      <Bar dataKey="simulated" name="Simulated" fill="hsl(160,84%,39%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-display">New Opportunities Unlocked</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {newJobMatches.map(j => (
                  <div key={j.id} className="rounded-lg border border-border/50 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm break-words">{j.role}</p>
                      <p className="text-xs text-muted-foreground">{formatINRRange(j.salary_min, j.salary_max)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">{j.currentMatch}% → <span className="text-primary font-bold">{j.simMatch}%</span></p>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">+{j.simMatch - j.currentMatch}%</Badge>
                    </div>
                  </div>
                ))}
                {newJobMatches.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No new job matches with selected skills</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
