import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Authentication failed';
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,hsl(160_84%_39%/0.18),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(199_89%_48%/0.15),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,560px)]">
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 text-primary-foreground bg-[linear-gradient(150deg,hsl(166_84%_32%),hsl(199_89%_45%))]">
          <div className="max-w-lg space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="font-display text-3xl font-bold">SkillWorth</h1>
            </div>
            <p className="text-2xl xl:text-4xl font-display leading-tight opacity-95">
              A career system for turning skills into job readiness and financial momentum.
            </p>
            <div className="grid gap-3 text-sm opacity-90">
              <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Skill gap analysis & career matching</div>
              <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Salary prediction engine</div>
              <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Financial planning & budgeting</div>
              <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Career growth simulation</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-2xl bg-primary-foreground/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Skills</p>
              <p className="text-xl font-display font-bold mt-2">Map</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Roles</p>
              <p className="text-xl font-display font-bold mt-2">Match</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Money</p>
              <p className="text-xl font-display font-bold mt-2">Plan</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <Card className="w-full max-w-md panel-soft shadow-2xl">
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-hero hover-glow flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl">SkillWorth</span>
              </div>
              <CardTitle className="font-display text-2xl sm:text-3xl">{isSignUp ? 'Create account' : 'Welcome back'}</CardTitle>
              <CardDescription>{isSignUp ? 'Start your career growth journey' : 'Sign in to your account'}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(value => !value)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full hover-glow" disabled={loading}>
                  {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
