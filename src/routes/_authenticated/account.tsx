import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, LogOut, Shield } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useGalaxyData";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Our Little Galaxy" },
      { name: "description", content: "Your sign-in details and connected accounts." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const providers =
    user?.identities?.map((i) => i.provider).filter((v, idx, a) => a.indexOf(v) === idx) ?? [];

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) toast.error("Couldn't update", { description: error.message });
    else {
      toast.success("Password updated");
      setPassword("");
    }
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Account"
        title="Your sign-in"
        subtitle="The keys to your little galaxy."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard strong>
            <h2 className="flex items-center gap-2 font-display text-2xl text-primary text-glow">
              <Mail className="h-5 w-5" /> Email
            </h2>
            <p className="mt-4 rounded-2xl bg-white/6 px-4 py-3 text-sm text-foreground/90">
              {user?.email ?? "—"}
            </p>
            <p className="mt-2 text-xs text-foreground/60">
              Sign in with the same email across all your devices.
            </p>

            <h3 className="mt-8 flex items-center gap-2 font-display text-xl text-primary">
              <Shield className="h-4 w-4" /> Connected sign-ins
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {providers.length === 0 ? (
                <span className="text-xs text-foreground/60">None</span>
              ) : (
                providers.map((p) => (
                  <span key={p} className="rounded-full bg-white/8 px-3 py-1 text-xs capitalize text-foreground/85">
                    {p}
                  </span>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard strong>
            <form onSubmit={changePassword}>
              <h2 className="flex items-center gap-2 font-display text-2xl text-primary text-glow">
                <KeyRound className="h-5 w-5" /> Change password
              </h2>
              <label className="mt-5 block">
                <span className="text-xs uppercase tracking-widest text-foreground/70">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-primary/60"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {saving ? "Saving…" : "Update password"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-foreground/85">Sign out of this device</p>
              <button
                onClick={signOut}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-destructive/80 px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </GlassCard>
        </div>
      </PageShell>
    </>
  );
}
