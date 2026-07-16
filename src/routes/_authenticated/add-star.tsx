import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
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

// ─── Static data ───────────────────────────────────────────────────────────────

const COLOR_KEYS = Object.keys(STAR_COLORS) as StarColor[];

const COLOR_META: Record<StarColor, { label: string; description: string }> = {
  gold:   { label: "Golden Glow",   description: "Warm and radiant" },
  rose:   { label: "Rose Blush",    description: "Tender and loving" },
  sky:    { label: "Sky Blue",      description: "Peaceful and dreamy" },
  sage:   { label: "Sage Green",    description: "Grounding and true" },
  blush:  { label: "Soft Blush",    description: "Playful and bright" },
  violet: { label: "Violet Dream",  description: "Magical and rare" },
};

// Accent colours for each emotion card glow — mapped to the existing star palette.
const EMOTION_ACCENT: Record<string, string> = {
  love:      STAR_COLORS.rose,
  joy:       STAR_COLORS.gold,
  memory:    STAR_COLORS.sky,
  dream:     STAR_COLORS.violet,
  milestone: STAR_COLORS.sage,
  thanks:    STAR_COLORS.blush,
};

// Precomputed twinkle dot positions so Math.random() never runs in render.
const TWINKLE_DOTS = [
  { top: 18, left: 22, size: 2.5, delay: 0.0 },
  { top: 28, left: 74, size: 2.0, delay: 0.6 },
  { top: 55, left: 14, size: 3.0, delay: 1.2 },
  { top: 65, left: 68, size: 2.5, delay: 0.3 },
  { top: 78, left: 38, size: 2.0, delay: 1.8 },
  { top: 42, left: 85, size: 1.5, delay: 0.9 },
  { top: 12, left: 52, size: 2.0, delay: 2.1 },
  { top: 82, left: 58, size: 2.5, delay: 1.5 },
];

// ─── Shared sub-components ─────────────────────────────────────────────────────

/** Glowing, floating star orb — the live preview used across all steps. */
function StarOrb({
  color,
  size = 140,
  float = true,
}: {
  color: string;
  size?: number;
  float?: boolean;
}) {
  return (
    <div
      className={float ? "animate-float-y" : ""}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 38% 32%, white 0%, ${color} 35%, ${color}88 80%)`,
        boxShadow: [
          `0 0 ${Math.round(size * 0.25)}px ${color}`,
          `0 0 ${Math.round(size * 0.6)}px ${color}55`,
          `0 0 ${Math.round(size * 1.2)}px ${color}22`,
        ].join(", "),
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sparkles
          style={{ width: size * 0.28, height: size * 0.28, color: "white", opacity: 0.7 }}
        />
      </div>
      {TWINKLE_DOTS.map((d, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

/** Four-dot progress indicator with an active pill. */
function StepDots({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            height: 7,
            width: i + 1 === current ? 28 : 7,
            background:
              i + 1 <= current
                ? "var(--color-primary)"
                : "oklch(1 0 0 / 0.18)",
            opacity: i + 1 < current ? 0.55 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Page shell ────────────────────────────────────────────────────────────────

function AddStarPage() {
  const navigate = useNavigate();
  const create = useCreateStar();
  const { allowed, max, reason, isLoading: limitLoading } = useStarLimit();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [emotion, setEmotion] = useState("love");
  const [color, setColor] = useState<StarColor>("gold");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [starredOn, setStarredOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [success, setSuccess] = useState(false);

  const activeColor = STAR_COLORS[color];
  const activeEmotion = EMOTIONS.find((e) => e.key === emotion)!;

  const cast = async () => {
    if (!title.trim()) {
      toast.error("Give your star a name first");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        note: note.trim(),
        color,
        emotion,
        starred_on: starredOn,
      });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/my-jar" }), 2200);
    } catch (err) {
      toast.error("Couldn't cast this star", { description: (err as Error).message });
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ThemeBoot />
        <CozyRoom />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="animate-pixel-pop">
            <StarOrb color={activeColor} size={200} float={false} />
          </div>
          <p
            className="mt-6 text-5xl animate-reveal"
            style={{ animationDelay: "0.25s" }}
          >
            {activeEmotion.emoji}
          </p>
          <h1
            className="font-display mt-4 text-5xl text-primary text-glow animate-reveal sm:text-6xl"
            style={{ animationDelay: "0.45s" }}
          >
            Star cast! ✨
          </h1>
          <p
            className="font-elegant mt-3 text-xl text-foreground/70 animate-reveal"
            style={{ animationDelay: "0.65s" }}
          >
            "{title}" is now floating in your jar.
          </p>
          <p
            className="font-elegant mt-2 text-sm text-foreground/45 animate-reveal"
            style={{ animationDelay: "0.85s" }}
          >
            Taking you there…
          </p>
        </div>
      </div>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />
      <MusicPlayer />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-28 sm:px-6" style={{ paddingTop: "max(6rem, 10vh)" }}>

        {/* ── Nav bar: back + step dots ── */}
        <div className="relative mb-10 flex items-center justify-center animate-reveal">
          {/* Back button — left-anchored */}
          <div className="absolute left-0">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/70 transition hover:bg-white/12 glass"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground/70 transition hover:bg-white/12 glass"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            )}
          </div>

          <StepDots current={step} />
        </div>

        {/* ── Limit gate ── */}
        {!limitLoading && !allowed && reason ? (
          <div className="animate-reveal">
            <UpgradeBanner message={reason} />
          </div>
        ) : (
          /* ── Step content — key forces re-mount → animate-reveal on each step ── */
          <div key={step} className="animate-reveal">
            {step === 1 && (
              <Step1Mood
                emotion={emotion}
                onSelect={(e) => {
                  setEmotion(e);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <Step2Color
                color={color}
                onSelect={setColor}
                onContinue={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <Step3Write
                activeColor={activeColor}
                activeEmotion={activeEmotion}
                title={title}
                setTitle={setTitle}
                note={note}
                setNote={setNote}
                starredOn={starredOn}
                setStarredOn={setStarredOn}
                onContinue={() => {
                  if (!title.trim()) {
                    toast.error("Give your star a name before continuing");
                    return;
                  }
                  setStep(4);
                }}
              />
            )}
            {step === 4 && (
              <Step4Cast
                activeColor={activeColor}
                activeEmotion={activeEmotion}
                colorMeta={COLOR_META[color]}
                title={title}
                note={note}
                starredOn={starredOn}
                isPending={create.isPending}
                onCast={cast}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Step 1 — Mood ─────────────────────────────────────────────────────────────

function Step1Mood({
  emotion,
  onSelect,
}: {
  emotion: string;
  onSelect: (e: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[11px] uppercase tracking-[0.32em] text-primary/75">Step 1 of 4</p>
      <h1 className="font-display mt-2 text-5xl text-primary text-glow sm:text-6xl">
        How does this feel?
      </h1>
      <p className="font-elegant mt-3 text-lg text-foreground/60">
        Choose the mood of this memory.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {EMOTIONS.map((e, i) => {
          const accent = EMOTION_ACCENT[e.key] ?? STAR_COLORS.gold;
          const selected = emotion === e.key;
          return (
            <button
              key={e.key}
              onClick={() => onSelect(e.key)}
              className="glass relative overflow-hidden rounded-3xl p-6 text-center transition duration-200 hover:scale-[1.04]"
              style={{
                animationDelay: `${i * 0.07}s`,
                boxShadow: selected
                  ? `0 0 0 2px ${accent}, 0 0 32px ${accent}44`
                  : undefined,
              }}
            >
              {/* Selected glow fill */}
              {selected && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${accent}1c 0%, transparent 70%)`,
                  }}
                />
              )}
              <div className="relative text-5xl leading-none">{e.emoji}</div>
              <p className="font-display relative mt-3 text-xl text-primary">{e.label}</p>
            </button>
          );
        })}
      </div>

      <p className="font-elegant mt-8 text-sm text-foreground/40">
        Tap a mood to continue →
      </p>
    </div>
  );
}

// ─── Step 2 — Color ────────────────────────────────────────────────────────────

function Step2Color({
  color,
  onSelect,
  onContinue,
}: {
  color: StarColor;
  onSelect: (c: StarColor) => void;
  onContinue: () => void;
}) {
  const activeColor = STAR_COLORS[color];

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-[11px] uppercase tracking-[0.32em] text-primary/75">Step 2 of 4</p>
      <h1 className="font-display mt-2 text-5xl text-primary text-glow sm:text-6xl">
        What color is it?
      </h1>
      <p className="font-elegant mt-3 text-lg text-foreground/60">
        Pick the color that matches this memory.
      </p>

      {/* Live star preview */}
      <div className="mt-10 flex flex-col items-center gap-3">
        {/* key → re-mount triggers animate-pixel-pop on each color change */}
        <div key={color} className="animate-pixel-pop">
          <StarOrb color={activeColor} size={168} />
        </div>
        <p className="font-display mt-2 text-2xl text-primary text-glow">
          {COLOR_META[color].label}
        </p>
        <p className="font-elegant text-sm text-foreground/55">
          {COLOR_META[color].description}
        </p>
      </div>

      {/* Color swatch row */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
        {COLOR_KEYS.map((k) => {
          const c = STAR_COLORS[k];
          const selected = k === color;
          return (
            <button
              key={k}
              onClick={() => onSelect(k)}
              aria-label={COLOR_META[k].label}
              className="rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                width: 56,
                height: 56,
                background: `radial-gradient(circle at 38% 32%, white 0%, ${c} 40%, ${c}88 100%)`,
                boxShadow: selected
                  ? `0 0 0 3px white, 0 0 22px ${c}, 0 0 44px ${c}55`
                  : `0 0 14px ${c}44`,
                transform: selected ? "scale(1.2)" : undefined,
              }}
            />
          );
        })}
      </div>

      <button
        onClick={onContinue}
        className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-medium text-primary-foreground shadow-lg transition hover:scale-[1.03]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Sparkles className="h-4 w-4" />
        Continue with {COLOR_META[color].label}
      </button>
    </div>
  );
}

// ─── Step 3 — Write ────────────────────────────────────────────────────────────

function Step3Write({
  activeColor,
  activeEmotion,
  title,
  setTitle,
  note,
  setNote,
  starredOn,
  setStarredOn,
  onContinue,
}: {
  activeColor: string;
  activeEmotion: (typeof EMOTIONS)[number];
  title: string;
  setTitle: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  starredOn: string;
  setStarredOn: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.5fr]">

      {/* ── Left: live preview (desktop only) ── */}
      <div className="hidden lg:flex flex-col items-center gap-5 pt-6 sticky top-28">
        <StarOrb color={activeColor} size={160} />

        <div className="text-center">
          <p className="text-4xl leading-none">{activeEmotion.emoji}</p>
          <p className="font-elegant mt-2 text-sm text-foreground/55">
            {activeEmotion.label}
          </p>
        </div>

        {title && (
          <div
            className="glass max-w-[210px] rounded-2xl px-5 py-3 text-center transition-all"
            style={{ boxShadow: `0 0 30px ${activeColor}28` }}
          >
            <p className="font-display text-xl text-primary text-glow line-clamp-2 leading-snug">
              {title}
            </p>
          </div>
        )}

        {!title && (
          <p className="font-elegant text-sm text-foreground/35 text-center max-w-[180px]">
            Your star's name will appear here…
          </p>
        )}
      </div>

      {/* ── Right: form ── */}
      <div className="glass rounded-3xl p-7 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.32em] text-primary/75">Step 3 of 4</p>
        <h2 className="font-display mt-2 text-4xl text-primary text-glow">
          Write the memory
        </h2>
        <p className="font-elegant mt-1 text-base text-foreground/60">
          Name this moment. Give it words.
        </p>

        <label className="mt-7 block">
          <span className="text-xs uppercase tracking-widest text-foreground/65">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The night we danced in the kitchen"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-lg text-foreground placeholder:text-foreground/35 outline-none ring-1 ring-white/10 transition focus:ring-primary/60"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-widest text-foreground/65">
            Memory
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="Every little detail you want to keep forever…"
            className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground placeholder:text-foreground/35 outline-none ring-1 ring-white/10 transition focus:ring-primary/60"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-widest text-foreground/65">
            When did this happen?
          </span>
          <input
            type="date"
            value={starredOn}
            onChange={(e) => setStarredOn(e.target.value)}
            className="mt-2 w-full rounded-2xl bg-white/8 px-4 py-3 text-foreground outline-none ring-1 ring-white/10 transition focus:ring-primary/60"
          />
        </label>

        <button
          onClick={onContinue}
          disabled={!title.trim()}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium text-primary-foreground shadow-lg transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-4 w-4" />
          Preview your star
        </button>
      </div>
    </div>
  );
}

// ─── Step 4 — Cast ─────────────────────────────────────────────────────────────

function Step4Cast({
  activeColor,
  activeEmotion,
  colorMeta,
  title,
  note,
  starredOn,
  isPending,
  onCast,
}: {
  activeColor: string;
  activeEmotion: (typeof EMOTIONS)[number];
  colorMeta: { label: string; description: string };
  title: string;
  note: string;
  starredOn: string;
  isPending: boolean;
  onCast: () => void;
}) {
  // Format date without timezone shifting
  const formattedDate = new Date(starredOn + "T12:00:00").toLocaleDateString(
    undefined,
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="text-[11px] uppercase tracking-[0.32em] text-primary/75">Step 4 of 4</p>
      <h1 className="font-display mt-2 text-5xl text-primary text-glow sm:text-6xl">
        Ready to cast?
      </h1>
      <p className="font-elegant mt-3 text-lg text-foreground/60">
        Your star is ready for the jar.
      </p>

      {/* Star + emoji */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <StarOrb color={activeColor} size={200} />
        <p className="text-5xl leading-none">{activeEmotion.emoji}</p>
      </div>

      {/* Memory preview card */}
      <div
        className="glass mt-8 rounded-3xl p-7 text-left"
        style={{ boxShadow: `0 0 40px ${activeColor}1a` }}
      >
        <h2 className="font-display text-3xl text-primary text-glow leading-snug">
          {title}
        </h2>
        {note && (
          <p className="font-elegant mt-3 text-base leading-relaxed text-foreground/78">
            {note}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>{activeEmotion.emoji} {activeEmotion.label}</Chip>
          <Chip>✨ {colorMeta.label}</Chip>
          <Chip>📅 {formattedDate}</Chip>
        </div>
      </div>

      {/* Cast button */}
      <button
        onClick={onCast}
        disabled={isPending}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-lg font-semibold text-primary-foreground shadow-2xl transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: `0 8px 40px ${activeColor}44`,
        }}
      >
        <Sparkles className="h-5 w-5" />
        {isPending ? "Casting into the jar…" : "Cast into the jar ✨"}
      </button>

      <p className="font-elegant mt-5 text-xs text-foreground/35">
        This star will appear in your jar and on the dashboard.
      </p>
    </div>
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-foreground/75">
      {children}
    </span>
  );
}
