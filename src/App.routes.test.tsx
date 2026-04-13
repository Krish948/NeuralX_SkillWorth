import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const authState: {
  user: { id: string; email: string } | null;
  loading: boolean;
} = {
  user: null,
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    session: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/pages/Index", () => ({ default: () => <div>Index Page</div> }));
vi.mock("@/pages/Auth", () => ({ default: () => <div>Auth Page</div> }));
vi.mock("@/pages/Dashboard", () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock("@/pages/Skills", () => ({ default: () => <div>Skills Page</div> }));
vi.mock("@/pages/Career", () => ({ default: () => <div>Career Page</div> }));
vi.mock("@/pages/Finance", () => ({ default: () => <div>Finance Page</div> }));
vi.mock("@/pages/Simulation", () => ({ default: () => <div>Simulation Page</div> }));
vi.mock("@/pages/NotFound", () => ({ default: () => <div>Not Found</div> }));

import App from "@/App";

describe("app route protection", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users from protected routes to auth", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(await screen.findByText("Auth Page")).toBeInTheDocument();
  });

  it("shows loading state while auth state is resolving", () => {
    authState.loading = true;
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders protected page inside app layout for authenticated users", async () => {
    authState.user = { id: "user-1", email: "user@example.com" };
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
  });
});
