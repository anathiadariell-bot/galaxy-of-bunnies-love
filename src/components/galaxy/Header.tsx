import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { label: "Home", to: "/" as const },
  { label: "My Jar", to: "/dashboard" as const },
  { label: "Add Star", to: "/dashboard" as const },
  { label: "Love Letters", to: "/dashboard" as const },
  { label: "Timeline", to: "/dashboard" as const },
  { label: "Galaxy Mode", to: "/dashboard" as const },
  { label: "Themes", to: "/dashboard" as const },
  { label: "Achievements", to: "/dashboard" as const },
  { label: "Settings", to: "/dashboard" as const },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl text-primary text-glow">
          <Sparkles className="h-5 w-5" />
          Our Little Galaxy
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {NAV.slice(0, 6).map((n) => (
            <Link
              key={n.label}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-sm text-foreground/80 transition hover:bg-white/10 hover:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="hidden sm:inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Open Galaxy
            </Link>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Sign in
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="glass flex h-10 w-10 items-center justify-center rounded-full xl:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-4 mt-1 glass-strong animate-reveal rounded-3xl p-4 xl:hidden">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-2 text-sm text-foreground/85 hover:bg-white/10 hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to={user ? "/dashboard" : "/auth"}
              onClick={() => setOpen(false)}
              className="col-span-2 rounded-2xl bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground sm:col-span-3"
            >
              {user ? "Open Galaxy" : "Account"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
