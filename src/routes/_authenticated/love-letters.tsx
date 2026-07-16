import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, Send } from "lucide-react";
import { PageShell } from "@/components/galaxy/PageShell";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { GlassCard } from "@/components/galaxy/GlassCard";
import { EmptyState } from "@/components/galaxy/EmptyState";
import { UpgradeBanner } from "@/components/galaxy/UpgradeBanner";
import { useCreateLetter, useLetters, useLetterLimit } from "@/hooks/useGalaxyData";

export const Route = createFileRoute("/_authenticated/love-letters")({
  head: () => ({
    meta: [
      { title: "Love Letters — Our Little Galaxy" },
      { name: "description", content: "Write letters to the future you'll open one day." },
    ],
  }),
  component: LoveLettersPage,
});

function LoveLettersPage() {
  const { data: letters = [] } = useLetters();
  const create = useCreateLetter();
  const { allowed, count, max, reason, isLoading } = useLetterLimit();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unlockAt, setUnlockAt] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowed) return;
    if (!title.trim() || !body.trim()) {
      toast.error("A letter needs a title and a message");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        unlock_at: unlockAt ? new Date(unlockAt).toISOString() : null,
      });
      toast.success("Letter sealed with love 💌");
      setTitle(""); setBody(""); setUnlockAt("");
    } catch (err) {
      toast.error("Couldn't seal this letter", { description: (err as Error).message });
    }
  };

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <ThemeBoot />
      <PageShell
        eyebrow="Love Letters"
        title="Words for the future you"
        subtitle="Write a letter. Choose a date. Read it together when the stars align."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Write panel */}
          <div className="space-y-4">
            {/* Limit counter pill */}
            {!isLoading && max !== Infinity && (
              <div className="flex justify-end">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  allowed ? "bg-white/10 text-foreground/60" : "bg-primary/20 text-primary"
                }`}>
                  {count} / {max} letters used
                </span>
              </div>
            )}

            {/* Upgrade banner when limit is reached */}
            {!isLoading && !allowed && reason && (
              <UpgradeBanner message={reason} />
            )}

            <form onSubmit={submit}>
              <GlassCard strong>
                <div className="flex items-center gap-2 text-primary">
                  <Mail className="h-5 w-5" />
                  <h2 className="font-display text-2xl text-glow">Write a letter</h2>
                </div>
                <label className="mt-6 block">
                  <span className="text-xs uppercase tracking-widest text-foreground/70">To…</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="To my love, on our first year"
                    disabled={!allowed}
                    className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-xs uppercase tracking-widest text-foreground/70">Message</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    placeholder="Write from the heart…"
                    disabled={!allowed}
                    className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="text-xs uppercase tracking-widest text-foreground/70">Open on (optional)</span>
                  <input
                    type="date"
                    value={unlockAt}
                    onChange={(e) => setUnlockAt(e.target.value)}
                    disabled={!allowed}
                    className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground outline-none ring-1 ring-white/10 focus:ring-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </label>
                <button
                  type="submit"
                  disabled={create.isPending || !allowed || isLoading}
                  className="font-elegant mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-lg text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Send className="h-4 w-4 not-italic" /> {create.isPending ? "Sealing…" : "Seal with love"}
                </button>
              </GlassCard>
            </form>
          </div>

          {/* Letters list */}
          <div>
            {letters.length === 0 ? (
              <EmptyState
                icon={<Mail className="h-6 w-6" />}
                title="No letters yet"
                description="Your envelopes will land right here as soon as you seal one."
              />
            ) : (
              <div className="grid gap-4">
                {letters.map((l, i) => {
                  const locked = l.unlock_at ? new Date(l.unlock_at).getTime() > Date.now() : false;
                  const isOpen = openId === l.id;
                  return (
                    <GlassCard key={l.id} delay={i * 0.05} className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-2xl text-primary text-glow">{l.title}</h3>
                          <p className="font-elegant mt-1 text-sm text-foreground/60">
                            Sealed {new Date(l.created_at).toLocaleDateString()}
                            {l.unlock_at && ` · Opens ${new Date(l.unlock_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        {locked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-foreground/70">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => setOpenId(isOpen ? null : l.id)}
                            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                          >
                            {isOpen ? "Close" : "Open"}
                          </button>
                        )}
                      </div>
                      {isOpen && !locked && (
                        <p className="font-elegant mt-4 whitespace-pre-wrap text-base text-foreground/85 animate-reveal">{l.body}</p>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageShell>
    </>
  );
}
