import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { getJobMatchScore, getSkillGaps, careerPaths, calculateSalaryFromSkills } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Briefcase, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { formatINR, formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

export default function Career() {
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();

  if (userSkillsLoading || jobsLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading career insights"
          description="Analyzing your profile and job matches..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load career insights"
          description="Please refresh and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const skillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];
  const salary = calculateSalaryFromSkills(skillNames);

  const jobMatches = jobs
    .map(j => ({
      ...j,
      match: getJobMatchScore(skillNames, j.required_skills),
      gaps: getSkillGaps(skillNames, j.required_skills),
    }))
    .sort((a, b) => b.match - a.match);

  const suggestedPaths = Object.entries(careerPaths)
    .map(([key, path]) => {
      const owned = path.requiredSkills.filter(s => skillNames.includes(s));
      return { key, ...path, progress: Math.round((owned.length / path.requiredSkills.length) * 100) };
    })
    .sort((a, b) => b.progress - a.progress);

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Career Insights</h1>
          <p className="text-muted-foreground mt-1">Job recommendations and career paths based on your skills</p>
        </div>
      </div>

      <Card className="border-border/50 gradient-career text-career-foreground">
        <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 opacity-80 flex-shrink-0" />
            <div>
              <p className="text-sm opacity-80">Estimated Salary Range</p>
              <p className="text-2xl sm:text-3xl font-display font-bold break-words">{formatINRRange(salary.min, salary.max)}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm opacity-80">Based on {skillNames.length} skills</p>
            <p className="text-base sm:text-lg font-bold font-display break-words">~{formatINR(salary.estimated)}/yr</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Job Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobMatches.length === 0 && <p className="text-muted-foreground text-sm">Add skills to get recommendations</p>}
            {jobMatches.map(j => (
              <div key={j.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium break-words">{j.role}</p>
                  <Badge variant={j.match >= 75 ? 'default' : j.match >= 50 ? 'secondary' : 'outline'}>
                    {j.match}% match
                  </Badge>
                </div>
                <Progress value={j.match} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatINRRange(j.salary_min, j.salary_max)}</span>
                </div>
                {j.gaps.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Missing:</span>
                    {j.gaps.map(g => (
                      <Badge key={g} variant="outline" className="text-[10px] px-1.5 py-0 text-destructive border-destructive/30">{g}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Career Paths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedPaths.map(p => (
              <div key={p.key} className="rounded-lg border border-border/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm break-words pr-2">{p.title}</p>
                  <span className="text-sm font-bold text-primary">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-1.5" />
                <div className="flex flex-wrap gap-1 items-center">
                  {p.steps.map((step, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {i > 0 && <ArrowRight className="w-2.5 h-2.5" />}
                      <span className={p.requiredSkills[i] && skillNames.includes(p.requiredSkills[i]) ? 'text-primary font-medium' : ''}>
                        {step}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
