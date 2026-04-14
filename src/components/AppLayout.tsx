import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Sparkles, Briefcase, Wallet, FlaskConical, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/skills', label: 'Skills', icon: Sparkles },
  { to: '/career', label: 'Career', icon: Briefcase },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/simulation', label: 'Simulate', icon: FlaskConical },
  { to: '/planner', label: 'Planner', icon: ClipboardList },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-foreground">SkillWorth</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline text-sm text-muted-foreground max-w-[180px] lg:max-w-[260px] truncate">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t bg-card p-4 flex flex-col gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">{children}</main>
    </div>
  );
}
