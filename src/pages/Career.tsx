import { useMemo, useState } from 'react';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { getJobMatchScore, getSkillGaps, careerPaths, calculateSalaryFromSkills } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Radar, Layers, Sparkles, Target, TrendingUp, ArrowRight, Search } from 'lucide-react';
import { formatINR, formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

export default function Career() {
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePath, setActivePath] = useState<string>(Object.keys(careerPaths)[0] || '');
  const [roleSearch, setRoleSearch] = useState('');
  const [demandSearch, setDemandSearch] = useState('');
  const [pathSearch, setPathSearch] = useState('');

  if (userSkillsLoading || jobsLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading career command center"
          description="Mapping role fit, skill demand, and pathway momentum..."
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

  const jobMatches = useMemo(
    () =>
      jobs
        .map(job => ({
          ...job,
          match: getJobMatchScore(skillNames, job.required_skills),
          gaps: getSkillGaps(skillNames, job.required_skills),
        }))
        .sort((a, b) => b.match - a.match),
    [jobs, skillNames],
  );

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(jobs.map(job => job.category)))],
    [jobs],
  );

  const filteredMatches = useMemo(
    () =>
      activeCategory === 'all'
        ? jobMatches
        : jobMatches.filter(job => job.category === activeCategory),
    [activeCategory, jobMatches],
  );

  const roleFilteredMatches = useMemo(
    () =>
      filteredMatches.filter(job =>
        roleSearch.trim().length === 0
          ? true
          : job.role.toLowerCase().includes(roleSearch.trim().toLowerCase()),
      ),
    [filteredMatches, roleSearch],
  );

  const roleSpotlight = roleFilteredMatches[0];

  const demandGaps = useMemo(() => {
    const demandBySkill: Record<string, number> = {};

    roleFilteredMatches.forEach(job => {
      job.gaps.forEach(skill => {
        demandBySkill[skill] = (demandBySkill[skill] || 0) + 1;
      });
    });

    return Object.entries(demandBySkill)
      .map(([skill, demand]) => ({ skill, demand }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 8);
  }, [roleFilteredMatches]);

  const visibleDemandGaps = useMemo(
    () =>
      demandGaps.filter(item =>
        demandSearch.trim().length === 0
          ? true
          : item.skill.toLowerCase().includes(demandSearch.trim().toLowerCase()),
      ),
    [demandGaps, demandSearch],
  );

  const suggestedPaths = useMemo(
    () =>
      Object.entries(careerPaths)
        .map(([key, path]) => {
          const owned = path.requiredSkills.filter(skill => skillNames.includes(skill));
          const missing = path.requiredSkills.filter(skill => !skillNames.includes(skill));
          return {
            key,
            ...path,
            progress: Math.round((owned.length / path.requiredSkills.length) * 100),
            missing,
          };
        })
        .sort((a, b) => b.progress - a.progress),
    [skillNames],
  );

  const visiblePaths = useMemo(
    () =>
      suggestedPaths.filter(path =>
        pathSearch.trim().length === 0
          ? true
          : `${path.key} ${path.title}`.toLowerCase().includes(pathSearch.trim().toLowerCase()),
      ),
    [suggestedPaths, pathSearch],
  );

  const selectedPath = visiblePaths.find(path => path.key === activePath) || visiblePaths[0];

  const highMatchCount = roleFilteredMatches.filter(job => job.match >= 75).length;
  const mediumMatchCount = roleFilteredMatches.filter(job => job.match >= 50 && job.match < 75).length;
  const lowMatchCount = roleFilteredMatches.filter(job => job.match < 50).length;

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <section className="page-hero">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,360px)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Career Command Center</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Role radar</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4">Design your next move with clearer signals.</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl">
              Compare role fit, reveal skill demand, and map the pathway that gets you to the next level faster.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/60 bg-card/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Skill portfolio</p>
              <p className="text-2xl font-display font-bold mt-2">{skillNames.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/90 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Salary estimate</p>
              <p className="text-2xl font-display font-bold mt-2">{formatINR(salary.estimated)}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/90 p-3 col-span-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Active roles</p>
              <p className="text-2xl font-display font-bold mt-2">{roleFilteredMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div className="space-y-6 min-w-0">
          <Card className="panel-soft overflow-hidden">
            <CardHeader className="bg-[linear-gradient(120deg,hsl(var(--career)/0.12),transparent)] border-b border-border/50">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" /> Role Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3">
              {roleSpotlight ? (
                <div className="rounded-xl border border-border/60 p-4 bg-card/80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Role spotlight</p>
                      <p className="text-xl font-bold font-display mt-1">{roleSpotlight.role}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatINRRange(roleSpotlight.salary_min, roleSpotlight.salary_max)}</p>
                    </div>
                    <Badge variant={roleSpotlight.match >= 75 ? 'default' : 'secondary'} className="text-xs">
                      {roleSpotlight.match}% ready
                    </Badge>
                  </div>
                  <Progress value={roleSpotlight.match} className="h-2 mt-3" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No roles match this filter yet.</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">High</p>
                  <p className="text-lg font-bold text-primary">{highMatchCount}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Medium</p>
                  <p className="text-lg font-bold">{mediumMatchCount}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 text-center">
                  <p className="text-[11px] text-muted-foreground">Low</p>
                  <p className="text-lg font-bold text-muted-foreground">{lowMatchCount}</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={roleSearch}
                  onChange={e => setRoleSearch(e.target.value)}
                  placeholder="Search roles in radar"
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {roleFilteredMatches.map(job => (
                  <article key={job.id} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{job.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatINRRange(job.salary_min, job.salary_max)}</p>
                      </div>
                      <Badge variant={job.match >= 75 ? 'default' : job.match >= 50 ? 'secondary' : 'outline'}>
                        {job.match}%
                      </Badge>
                    </div>
                    <Progress value={job.match} className="h-1.5 mt-2" />
                    {job.gaps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.gaps.slice(0, 4).map(gap => (
                          <Badge key={`${job.id}-${gap}`} variant="outline" className="text-[10px] px-1.5 py-0">
                            {gap}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {roleFilteredMatches.length === 0 && (
                  <p className="text-xs text-muted-foreground">No roles match your search.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Skill Demand Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={demandSearch}
                  onChange={e => setDemandSearch(e.target.value)}
                  placeholder="Search demand skills"
                  className="pl-9"
                />
              </div>
              {visibleDemandGaps.length === 0 && <p className="text-sm text-muted-foreground">No demand items match the current filters.</p>}
              {visibleDemandGaps.map(item => (
                <div key={item.skill} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{item.skill}</p>
                    <p className="text-xs text-muted-foreground">{item.demand} roles</p>
                  </div>
                  <Progress value={Math.min(100, item.demand * 16)} className="h-1.5 mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Pathway Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={pathSearch}
                  onChange={e => setPathSearch(e.target.value)}
                  placeholder="Search pathways"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visiblePaths.map(path => (
                  <Button
                    key={path.key}
                    variant={path.key === selectedPath?.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivePath(path.key)}
                    className="text-xs hover-glow"
                  >
                    {path.key}
                  </Button>
                ))}
              </div>

              {visiblePaths.length === 0 && (
                <p className="text-xs text-muted-foreground">No pathway matches your search.</p>
              )}

              {selectedPath && (
                <div className="rounded-2xl border border-border/60 p-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{selectedPath.title}</p>
                    <Badge variant="secondary">{selectedPath.progress}% complete</Badge>
                  </div>
                  <Progress value={selectedPath.progress} className="h-1.5 mt-2" />

                  <div className="mt-3 space-y-2">
                    {selectedPath.steps.map((step, index) => {
                      const requiredSkill = selectedPath.requiredSkills[index];
                      const isCovered = requiredSkill ? skillNames.includes(requiredSkill) : false;

                      return (
                        <div key={step} className="flex items-center gap-2 text-xs">
                          <Sparkles className={`w-3.5 h-3.5 ${isCovered ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={isCovered ? 'font-medium text-foreground' : 'text-muted-foreground'}>{step}</span>
                          {index < selectedPath.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      );
                    })}
                  </div>

                  {selectedPath.missing.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {selectedPath.missing.slice(0, 4).map(skill => (
                        <Badge key={`${selectedPath.key}-${skill}`} variant="outline" className="text-[10px]">
                          missing {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gradient-career hover-glow text-career-foreground border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-xs opacity-90">Salary Trajectory</p>
                  <p className="text-xl font-bold font-display mt-1">{formatINRRange(salary.min, salary.max)}</p>
                  <p className="text-xs opacity-90 mt-1">Current estimate: {formatINR(salary.estimated)} per year</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="panel-soft">
            <CardHeader>
              <CardTitle className="text-lg font-display">Career Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Focused</p>
                  <p className="text-lg font-bold">{roleFilteredMatches.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Demand</p>
                  <p className="text-lg font-bold">{visibleDemandGaps.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Paths</p>
                  <p className="text-lg font-bold">{visiblePaths.length}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the left column to filter roles and demand, then use this rail to inspect the most realistic pathway and compensation range.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
