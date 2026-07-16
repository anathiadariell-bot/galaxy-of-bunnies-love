import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { applyTheme, getStoredTheme, THEMES, type ThemeKey } from "@/lib/galaxy";
import { useProfile, useUpdateProfile, usePlan } from "@/hooks/useGalaxyData";
import { canUseTheme } from "@/lib/plans";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({
    meta: [
      { title: "Themes — Our Little Galaxy" },
      { name: "description", content: "Choose the atmosphere for your little galaxy." },
    ],
  }),
  component: ThemesPage,
});

function ThemesPage() {
  const { data: profile } = useProfile();
  const { plan } = usePlan();
  const update = useUpdateProfile();
  const [active, setActive] = useState<ThemeKey>("night");

  useEffect(() => {
    setActive((profile?.theme as ThemeKey) ?? getStoredTheme());
  }, [profile?.theme]);

  const pick = async (t: ThemeKey) => {
    if (!canUseTheme(plan, t)) {
      toast("Premium theme 🔒", {
        description: "Upgrade to Premium to unlock all four atmospheres. ✨",
      });
      return;
    }
    setActive(t);
    applyTheme(t);
    try {
      await update.mutateAsync({ theme: t });
      toast.success(`Theme changed to ${THEMES.find((x) => x.key === t)?.label}`);
    } catch {
      toast("Theme applied locally", { description: "We'll sync it next time you're online." });
    }
  };

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Themes"
        title="Set the atmosphere"
        subtitle="Match your galaxy to how the two of you feel today."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {THEMES.map((t, i) => {
            const selected = active === t.key;
            const locked = !canUseTheme(plan, t.key);

            return (
              <GlassCard
                key={t.key}
                delay={i * 0.06}
                className={`p-0 overflow-hidden ${locked ? "opacity-80" : "cursor-pointer"}`}
              >
                <button onClick={() => pick(t.key)} className="w-full text-left">
                  {/* Preview swatch */}
                  <div
                    className="relative h-40 w-full"
                    style={{
                      background: `linear-gradient(180deg, ${t.colors[0]}, ${t.colors[1]} 60%, ${t.colors[3]} 100%)`,
                    }}
                  >
                    {[...Array(18)].map((_, k) => (
                      <span
                        key={k}
                        className="absolute animate-twinkle rounded-full"
                        style={{
                          top: `${Math.random() * 80}%`,
                          left: `${Math.random() * 96}%`,
                          width: 2 + Math.random() * 3,
                          height: 2 + Math.random() * 3,
                          background: t.colors[1],
                          animationDelay: `${Math.random() * 4}s`,
                          boxShadow: `0 0 8px ${t.colors[1]}`,
                        }}
                      />
                    ))}
                    <div
                      className="absolute right-6 top-6 h-14 w-14 rounded-full"
                      style={{ background: t.colors[1], boxShadow: `0 0 40px ${t.colors[1]}` }}
                    />

                    {/* Premium lock overlay */}
                    {locked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                          <Lock className="h-5 w-5 text-white" />
                        </div>
                        <span className="rounded-full bg-primary/80 px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                          ✨ Premium
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Label row */}
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-display text-2xl text-primary text-glow">{t.label}</p>
                      <p className="text-sm text-foreground/70">{t.description}</p>
                    </div>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        selected && !locked
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10"
                      }`}
                    >
                      {selected && !locked && <Check className="h-4 w-4" />}
                      {locked && <Lock className="h-3.5 w-3.5 text-foreground/40" />}
                    </div>
                  </div>
                </button>
              </GlassCard>
            );
          })}
        </div>

        {plan === "free" && (
          <p className="mt-6 text-center text-sm text-foreground/50">
            🔒 Three themes are locked on the Free plan. Upgrade to Premium to unlock them all.
          </p>
        )}
      </PageShell>
    </>
  );
}
