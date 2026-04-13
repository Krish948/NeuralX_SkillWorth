import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8 text-center shadow-xl backdrop-blur">
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold font-display">404</h1>
        <p className="mb-6 text-base text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
