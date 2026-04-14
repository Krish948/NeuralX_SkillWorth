import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg page-hero text-center shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lost in space</p>
        <h1 className="mb-3 mt-2 text-4xl sm:text-6xl font-bold font-display">404</h1>
        <p className="mb-6 text-base text-muted-foreground">This route does not exist in your mission map.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <a href="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Return to Home
          </a>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/60">
            Open dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
