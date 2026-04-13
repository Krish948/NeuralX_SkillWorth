import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Briefcase, Sparkles, Wallet, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useJobs } from '@/hooks/useJobs';
import { useFinance } from '@/hooks/useFinance';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getStorageItem, setStorageItem } from '@/lib/local-storage';

type ChecklistItem = {
  label: string;
  done: boolean;
  href: string;
  icon: typeof Sparkles;
};

const DISMISS_PREFIX = 'skillworth:onboarding-dismissed:';

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const { data: userSkills = [] } = useUserSkills();
  const { data: jobs = [] } = useJobs();
  const { data: finance } = useFinance();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setDismissed(getStorageItem(`${DISMISS_PREFIX}${user.id}`) === '1');
  }, [user?.id]);

  const checklist = useMemo<ChecklistItem[]>(() => [
    {
      label: 'Add at least one skill',
      done: userSkills.length > 0,
      href: '/skills',
      icon: Sparkles,
    },
    {
      label: 'Review matching jobs',
      done: jobs.length > 0,
      href: '/career',
      icon: Briefcase,
    },
    {
      label: 'Set a budget and goal',
      done: Boolean(finance),
      href: '/finance',
      icon: Wallet,
    },
  ], [finance, jobs.length, userSkills.length]);

  const completedCount = checklist.filter(item => item.done).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  if (dismissed || completedCount === checklist.length) return null;

  const handleDismiss = () => {
    if (user?.id) {
      setStorageItem(`${DISMISS_PREFIX}${user.id}`, '1');
    }
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Quick start</p>
            <h2 className="text-lg sm:text-xl font-display font-bold mt-1">Finish your setup</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete these steps once, then keep using the dashboard to track your growth.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} aria-label="Dismiss onboarding">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Setup progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {checklist.map(item => (
            <div key={item.label} className={`rounded-lg border p-3 ${item.done ? 'border-primary/30 bg-background/70' : 'border-border/60 bg-background'}`}>
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {item.done ? <CheckCircle2 className="w-4 h-4" /> : <item.icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.label}</p>
                  <Link to={item.href} className="text-xs text-primary hover:underline mt-1 inline-block">
                    {item.done ? 'Review' : 'Go there'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}