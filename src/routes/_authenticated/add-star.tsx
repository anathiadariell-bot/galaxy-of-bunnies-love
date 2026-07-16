import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { UpgradeBanner } from "@/components/galaxy/UpgradeBanner";
import { STAR_COLORS, EMOTIONS, type StarColor } from "@/lib/galaxy";
import { useCreateStar, useStarLimit } from "@/hooks/useGalaxyData";

export const Route = createFileRoute("/_authenticated/add-star")({
  head: () => ({
    meta: [
      { title: "Add a Star — Our Little Galaxy" },
      { name: "description", content: "Turn a memory into a glowing star inside your jar." },
    ],
  }),
  component: AddStarPage,
});

const COLOR_KEYS = Object.keys(STAR_COLORS) as StarColor[];

function AddStarPage() {
  const navigate = useNavigate();
  const create = useCreateStar();
  const { allowed, count, max, reason, isLoading } = useStarLimit();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState<StarColor>("gold");
  const [emotion, setEmotion] = useState<string>("love");
  const [starredOn, setStarredOn] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed) return; // belt-and-suspenders; banner is already shown
    if (!title.trim()) {
      toast.error("Give your star a name");
      return;
    }
    try {
      await create.mutateAsync({ title: title.trim(), note: note.trim(), color, emotion, starred_on: starredOn });
      toast.success("A new star is glowing ✨");
      navigate({ to: "/my-jar" });
    } catch (err) {
      toast.error("Couldn't save this one", { description: (err as Error).message });
    }
  };

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Add Star"
        title="What do you want to remember?"
        subtitle="Give the moment a name and it will float inside the jar forever."
      >
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Limit counter pill */}
          {!isLoading && max !== Infinity && (
            <div className="flex justify-end">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                allowed ? "bg-white/10 text-foreground/60" : "bg-primary/20 text-primary"
              }`}>
                {count} / {max} stars used
              </span>
            </div>
          )}

          {/* Upgrade prompt replaces the form when limit is reached */}
          {!isLoading && !allowed && reason && (
            <UpgradeBanner message={reason} />
          )}

          <form onSubmit={submit}>
            <GlassCard strong className="p-8 sm:p-10">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The night we danced in the kitchen"
                  disabled={!allowed}
                  className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </label>

              <label className="mt-6 block">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Note</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="A little detail so you remember it exactly…"
                  disabled={!allowed}
                  className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </label>

              <label className="mt-6 block">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Date</span>
                <input
                  type="date"
                  value={starredOn}
                  onChange={(e) => setStarredOn(e.target.value)}
                  disabled={!allowed}
                  className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </label>

              <div className="mt-6">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Feeling</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setEmotion(e.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition ${
                        emotion === e.key
                          ? "bg-primary text-primary-foreground"
                          : "glass text-foreground/85 hover:bg-white/15"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <span>{e.emoji}</span> {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <span className="text-xs uppercase tracking-widest text-foreground/70">Star color</span>
                <div className="mt-3 flex flex-wrap gap-3">
                  {COLOR_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setColor(k)}
                      className={`h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-transparent transition ${
                        color === k ? "ring-white/80 scale-110" : "ring-white/20"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                      style={{ background: STAR_COLORS[k], boxShadow: `0 0 20px ${STAR_COLORS[k]} / 0.6` }}
                      aria-label={k}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={create.isPending || !allowed || isLoading}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium text-primary-foreground shadow-lg transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles className="h-4 w-4" />
                {create.isPending ? "Placing your star…" : "Place this star in the jar"}
              </button>
            </GlassCard>
          </form>
        </div>
      </PageShell>
    </>
  );
}
