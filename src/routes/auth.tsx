import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NightSky } from "@/components/galaxy/NightSky";
import { Sparkles, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;

        if (data.session) {
          // Email confirmation is off for this project — the user is signed in immediately.
          toast.success("Welcome to your little galaxy ✨");
          navigate({ to: "/dashboard", replace: true });
        } else {
          // Email confirmation is required before a session can be created. Don't navigate
          // to a protected route yet — there's no session, so it would just bounce back here.
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("login");
          setPassword("");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.code === "email_not_confirmed") {
            throw new Error("Please confirm your email address first — check your inbox for the confirmation link.");
          }
          throw error;
        }
        if (data.session) navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setLoading(true);
    // Sign in directly through Supabase's own OAuth flow (redirects the browser to Supabase's
    // hosted /authorize endpoint, then on to the provider). Do not route this through Lovable's
    // cloud-auth-js broker (`/~oauth/initiate`) — that endpoint only exists on Lovable's own
    // hosting, so on Replit (or any other host) it 404s.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // On success the browser navigates away to the provider immediately; nothing left to do here.
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightSky />
      <Link to="/" className="absolute top-6 left-6 z-20 glass flex h-10 w-10 items-center justify-center rounded-full text-primary hover:scale-110 transition">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-5xl text-primary text-glow">
              {mode === "login" ? "Welcome Back" : "Join Us"}
            </h1>
            <p className="mt-2 text-sm text-foreground/75">
              {mode === "login" ? "Sign in to open your galaxy." : "Start collecting your stars."}
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => oauth("google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-medium text-galaxy-night transition hover:scale-[1.02] disabled:opacity-60"
              >
                <GoogleIcon /> Google
              </button>
              <button
                onClick={() => oauth("apple")}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full bg-galaxy-night/90 px-4 py-2.5 text-sm font-medium text-foreground border border-white/15 transition hover:scale-[1.02] disabled:opacity-60"
              >
                <AppleIcon /> Apple
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-foreground/50">
              <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "register" && (
                <Field icon={<UserIcon className="h-4 w-4" />}>
                  <input
                    required
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-transparent outline-none placeholder:text-foreground/45"
                  />
                </Field>
              )}
              <Field icon={<Mail className="h-4 w-4" />}>
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-foreground/45"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />}>
                <input
                  required
                  minLength={6}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-foreground/45"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "One moment…" : mode === "login" ? "Enter Our Galaxy" : "Create My Galaxy"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-foreground/70">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary underline-offset-4 hover:underline"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/5 px-4 py-3 focus-within:border-primary/60 focus-within:bg-white/10 transition">
      <span className="text-primary/80">{icon}</span>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2.5 24 .5 14.8.5 6.9 5.8 3 13.5l7.8 6.1C12.7 13.7 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.8H24v9.1h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.8c4.3-4 7.2-9.9 7.2-17.3z"/><path fill="#FBBC05" d="M10.8 28.6c-.6-1.7-.9-3.5-.9-5.4s.3-3.7.9-5.4l-7.8-6.1C1.1 15.4 0 19.6 0 24s1.1 8.6 3 12.3l7.8-7.7z"/><path fill="#34A853" d="M24 47.5c6.2 0 11.4-2 15.2-5.5l-7.4-5.8c-2 1.4-4.6 2.2-7.8 2.2-6.1 0-11.3-4.1-13.2-9.7l-7.8 7.7C6.9 42.2 14.8 47.5 24 47.5z"/></svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.487 2.28-1.312 3.1-.902.897-2.35 1.577-3.518 1.487-.146-1.11.457-2.27 1.253-2.99.87-.81 2.352-1.482 3.577-1.597zM20.7 17.61c-.44 1-.98 1.95-1.62 2.86-.86 1.24-1.56 2.1-2.09 2.6-.83.77-1.72 1.16-2.66 1.18-.68 0-1.5-.19-2.44-.58-.94-.4-1.81-.58-2.6-.58-.83 0-1.72.19-2.68.58-.96.39-1.73.6-2.32.62-.9.04-1.81-.36-2.72-1.2C.9 21.9-.02 20.2-.02 17.75c0-2.55.79-4.9 2.37-7.03C3.65 8.63 5.5 7.34 7.62 7.3c.72 0 1.68.22 2.9.65 1.22.44 2 .66 2.34.66.26 0 1.13-.26 2.62-.78 1.4-.48 2.6-.68 3.58-.6 2.68.22 4.7 1.28 6.04 3.2-2.4 1.45-3.58 3.48-3.55 6.08.03 2.02.76 3.7 2.19 5.04.65.62 1.38 1.1 2.19 1.44-.17.5-.36.99-.57 1.46z"/></svg>
  );
}
