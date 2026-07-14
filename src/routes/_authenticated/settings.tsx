import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Save, LogOut, Palette, Music, Wind } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { useProfile, useUpdateProfile } from "@/hooks/useGalaxyData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Our Little Galaxy" },
      { name: "description", content: "Your profile, preferences and small comforts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [togetherSince, setTogetherSince] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setPartnerName(profile?.partner_name ?? "");
    setTogetherSince(profile?.together_since ?? "");
  }, [profile]);

  useEffect(() => {
    try {
      setReducedMotion(localStorage.getItem("olg-reduced-motion") === "1");
      setAutoplay(localStorage.getItem("olg-music-autoplay") === "1");
    } catch {}
  }, []);

  const save = async () => {
    try {
      await update.mutateAsync({
        display_name: displayName || null,
        partner_name: partnerName || null,
        together_since: togetherSince || null,
      });
      toast.success("Saved");
    } catch (err) {
      toast.error("Couldn't save", { description: (err as Error).message });
    }
  };

  const togglePref = (key: "olg-reduced-motion" | "olg-music-autoplay", value: boolean) => {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {}
    if (key === "olg-reduced-motion") setReducedMotion(value);
    else setAutoplay(value);
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
        eyebrow="Settings"
        title="Your little corner"
        subtitle="Tune your galaxy to feel just right."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard strong>
            <h2 className="font-display text-2xl text-primary text-glow">Profile</h2>
            <label className="mt-5 block">
              <span className="text-xs uppercase tracking-widest text-foreground/70">Your name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-primary/60"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-widest text-foreground/70">Partner's name</span>
              <input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-primary/60"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-widest text-foreground/70">Together since</span>
              <input
                type="date"
                value={togetherSince}
                onChange={(e) => setTogetherSince(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-primary/60"
              />
            </label>
            <button
              onClick={save}
              disabled={update.isPending}
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Save className="h-4 w-4" /> {update.isPending ? "Saving…" : "Save"}
            </button>
          </GlassCard>

          <GlassCard strong>
            <h2 className="font-display text-2xl text-primary text-glow">Preferences</h2>

            <Toggle
              icon={<Music className="h-4 w-4" />}
              label="Autoplay lo-fi music"
              description="Start the piano softly when you open the galaxy."
              value={autoplay}
              onChange={(v) => togglePref("olg-music-autoplay", v)}
            />
            <Toggle
              icon={<Wind className="h-4 w-4" />}
              label="Reduced motion"
              description="Calmer animations across the app."
              value={reducedMotion}
              onChange={(v) => togglePref("olg-reduced-motion", v)}
            />

            <Link
              to="/themes"
              className="mt-4 flex items-center justify-between rounded-2xl bg-white/6 p-4 transition hover:bg-white/10"
            >
              <span className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-primary" />
                <span>
                  <span className="block text-sm text-foreground/90">Change theme</span>
                  <span className="block text-xs text-foreground/60">Pick a new atmosphere</span>
                </span>
              </span>
              <span className="text-foreground/60">→</span>
            </Link>

            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
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

function Toggle({
  icon, label, description, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/6 p-4 text-left transition hover:bg-white/10"
    >
      <span className="flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        <span>
          <span className="block text-sm text-foreground/90">{label}</span>
          <span className="block text-xs text-foreground/60">{description}</span>
        </span>
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-primary" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
