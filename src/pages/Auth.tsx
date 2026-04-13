import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Authentication failed';
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
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
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,hsl(160_84%_39%/0.12),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(199_89%_48%/0.10),transparent_28%)]" />
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-1/2 gradient-hero flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="font-display text-3xl font-bold">SkillWorth</h1>
          </div>
          <p className="text-xl font-display leading-relaxed opacity-90">
            Analyze your skills. Grow your career. Plan your financial future.
          </p>
          <div className="space-y-3 text-sm opacity-80">
            <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Skill gap analysis & career matching</div>
            <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Salary prediction engine</div>
            <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Financial planning & budgeting</div>
            <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Career growth simulation</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">SkillWorth</span>
            </div>
            <CardTitle className="font-display text-xl sm:text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
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
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
