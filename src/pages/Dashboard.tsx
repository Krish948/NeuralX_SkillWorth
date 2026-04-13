import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { useFinance } from '@/hooks/useFinance';
import { calculateSalaryFromSkills, getJobMatchScore, skillSalaryMap } from '@/data/skillsMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Briefcase, TrendingUp, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatINR, formatINRCompact, formatINRRange } from '@/lib/currency';
import { StatePanel } from '@/components/ui/state-panel';

const CHART_COLORS = [
  'hsl(160,84%,39%)',
  'hsl(262,83%,58%)',
  'hsl(38,92%,50%)',
  'hsl(199,89%,48%)',
  'hsl(0,84%,60%)',
  'hsl(280,70%,48%)',
  'hsl(24,95%,53%)',
  'hsl(173,58%,39%)',
];
const CHART_DOT_COLORS = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-red-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-teal-500',
];

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { data: userSkills = [], isLoading: userSkillsLoading, error: userSkillsError } = useUserSkills();
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useJobs();
  const { data: finance, isLoading: financeLoading, error: financeError } = useFinance();

  if (userSkillsLoading || jobsLoading || financeLoading) {
    return (
      <div className="page-shell">
        <StatePanel
          type="loading"
          title="Loading your dashboard"
          description="Fetching skills, jobs, and finance insights..."
        />
      </div>
    );
  }

  if (userSkillsError || jobsError || financeError) {
    return (
      <div className="page-shell">
        <StatePanel
          type="error"
          title="Could not load dashboard"
          description="Please refresh the page and try again."
          actionLabel="Reload"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const skillNames = userSkills.map(us => us.skills?.name).filter(Boolean) as string[];
  const salary = calculateSalaryFromSkills(skillNames);

  const topJobs = jobs
    .map(j => ({ ...j, match: getJobMatchScore(skillNames, j.required_skills) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, 5);

  const skillsByCategory = userSkills.reduce((acc, us) => {
    const cat = us.skills?.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const entries = Object.entries(skillsByCategory)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const categoryData = entries.length <= 6
    ? entries
    : [
        ...entries.slice(0, 5),
        { name: 'Other', value: entries.slice(5).reduce((sum, item) => sum + item.value, 0) },
      ];

  const totalSkillsCount = categoryData.reduce((sum, item) => sum + item.value, 0);

  const pieChartData = categoryData.map((item, i) => ({
    ...item,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const totalExpenses = finance?.expenses
    ? finance.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    : 0;
  const monthlySavings = (finance?.income || 0) - totalExpenses;

  const salaryChartData = userSkills.map(us => {
    const name = us.skills?.name || '';
    const boost = (us.level / 5) * (skillSalaryMap[name]?.salaryBoost || 5000);
    return { name, boost };
  });
  const visibleSalaryChartData = isMobile ? salaryChartData.slice(0, 6) : salaryChartData;

  const stats = [
    { label: 'Skills Added', value: userSkills.length, icon: Sparkles, color: 'gradient-career' },
    { label: 'Job Matches', value: topJobs.filter(j => j.match > 50).length, icon: Briefcase, color: 'gradient-salary' },
    { label: 'Est. Salary', value: formatINRCompact(salary.estimated), icon: TrendingUp, color: 'gradient-finance' },
    { label: 'Monthly Savings', value: formatINR(monthlySavings), icon: Wallet, color: 'gradient-simulation' },
  ];

  return (
    <div className="space-y-6 animate-fade-in page-shell">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your career & financial overview</p>
        </div>
      </div>

      <OnboardingChecklist />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-display font-bold truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <div className="space-y-6 min-w-0">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                Top Job Matches
                <Link to="/career" className="text-sm text-primary font-normal hover:underline">View all →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topJobs.length === 0 && <p className="text-muted-foreground text-sm">Add skills to see job matches</p>}
              {topJobs.map(j => (
                <div key={j.id} className="flex flex-col gap-2 rounded-lg border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.role}</p>
                    <p className="text-xs text-muted-foreground">{formatINRRange(j.salary_min, j.salary_max)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Progress value={j.match} className="w-20 sm:w-24 h-2" />
                    <span className="text-xs font-medium w-8 text-right">{j.match}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display">Salary Impact by Skill</CardTitle>
            </CardHeader>
            <CardContent>
              {salaryChartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">Add skills to see salary impact</p>
              ) : (
                <div className="h-64 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visibleSalaryChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 11 }} angle={-30} textAnchor="end" height={60} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatINRCompact(v)} />
                      <Tooltip formatter={(v: number) => [formatINR(v), 'Salary Boost']} />
                      <Bar dataKey="boost" fill="hsl(160,84%,39%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center justify-between">
                Skills Distribution
                <Link to="/skills" className="text-sm text-primary font-normal hover:underline">Manage →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No skills added yet</p>
              ) : (
                <>
                  <div className="h-56 sm:h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 34 : 46}
                          outerRadius={isMobile ? 68 : 84}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={1}
                          label={false}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                          isAnimationActive={!isMobile}
                        >
                          {pieChartData.map((item) => <Cell key={item.name} fill={item.fill} />)}
                        </Pie>
                        <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-sm font-semibold">
                          {totalSkillsCount}
                        </text>
                        <text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground text-[11px]">
                          total skills
                        </text>
                        <Tooltip formatter={(value: number, _name, item: { payload?: { value?: number; name?: string } }) => {
                          const sliceValue = item?.payload?.value ?? value;
                          const percent = totalSkillsCount > 0 ? Math.round((sliceValue / totalSkillsCount) * 100) : 0;
                          return [`${sliceValue} skills (${percent}%)`, item?.payload?.name ?? 'Category'];
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {pieChartData.map((item, i) => {
                      const percent = totalSkillsCount > 0 ? Math.round((item.value / totalSkillsCount) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${CHART_DOT_COLORS[i % CHART_DOT_COLORS.length]}`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="text-muted-foreground flex-shrink-0">{item.value} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
