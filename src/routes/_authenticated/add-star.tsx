import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type CastPhase = "idle" | "awakening" | "flying" | "absorbed" | "celebrating";

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

// Accent colours for each emotion card glow
const EMOTION_ACCENT: Record<string, string> = {
  love:      STAR_COLORS.rose,
  joy:       STAR_COLORS.gold,
  memory:    STAR_COLORS.sky,
  dream:     STAR_COLORS.violet,
  milestone: STAR_COLORS.sage,
  thanks:    STAR_COLORS.blush,
};

// Precomputed twinkle dot positions (no Math.random in render)
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

// Precomputed burst particles — 12 rays spreading in all directions (deterministic)
const CAST_PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (2 * Math.PI * i) / 12;
  const r = 55 + (i % 3) * 22; // three rings: 55, 77, 99
  return {
    x: Math.round(Math.cos(angle) * r),
    y: Math.round(Math.sin(angle) * r),
    size: 6 + (i % 4) * 2,   // 6, 8, 10, 12 px
    delay: i * 0.035,
  };
});

// ─── Shared sub-components ─────────────────────────────────────────────────────

/** Glowing star orb — the live preview used across all steps and the casting scene. */
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

/** Four-dot step progress indicator. */
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

// ─── Casting animation scene ───────────────────────────────────────────────────

/**
 * Full-screen overlay that plays the "star flies into the jar" animation.
 * Phases: awakening → flying → absorbed → celebrating
 */
function CastingScene({
  activeColor,
  activeEmotion,
  title,
  phase,
}: {
  activeColor: string;
  activeEmotion: (typeof EMOTIONS)[number];
  title: string;
  phase: CastPhase;
}) {
  const isAwakening  = phase === "awakening";
  const isFlying     = phase === "flying";
  const isAbsorbed   = phase === "absorbed";
  const isCelebrating = phase === "celebrating";

  const showStar     = isAwakening || isFlying;
  const showAbsorb   = isAbsorbed || isCelebrating;
  const showParticles = isAbsorbed;
  const showText     = isCelebrating;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <ThemeBoot />
      <CozyRoom />

      {/* ── Ambient color wash — deepens during absorption ── */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 55% 42% at 50% 28%, ${activeColor}28 0%, transparent 70%)`,
          opacity: showAbsorb ? 1 : 0.4,
        }}
      />

      {/* ── Jar — fixed in upper portion of screen ── */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: "13vh", zIndex: 20 }}
      >
        {/* Color bloom that radiates outward on absorption */}
        {showAbsorb && (
          <div
            className="pointer-events-none absolute animate-cast-absorb-bloom rounded-full"
            style={{
              inset: "-15%",
              background: `radial-gradient(circle, ${activeColor}55 0%, ${activeColor}22 50%, transparent 75%)`,
              zIndex: -1,
            }}
          />
        )}

        {/* Jar with brightening filter on absorption */}
        <div
          className={showAbsorb ? "animate-cast-jar-absorb" : ""}
          style={
            showAbsorb
              ? ({ "--ac": activeColor } as React.CSSProperties)
              : undefined
          }
        >
          <MemoryJar size={220} />
        </div>

        {/* Burst particles from the jar's cork area */}
        {showParticles && (
          <div
            className="pointer-events-none absolute"
            style={{ top: "9%", left: "50%" }}
          >
            {CAST_PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute animate-cast-particle rounded-full"
                style={
                  {
                    "--px": `${p.x}px`,
                    "--py": `${p.y}px`,
                    width: p.size,
                    height: p.size,
                    marginLeft: -p.size / 2,
                    marginTop: -p.size / 2,
                    animationDelay: `${p.delay}s`,
                    background: activeColor,
                    boxShadow: `0 0 ${p.size * 2}px ${activeColor}`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Star — sits below jar, awakens then flies up ── */}
      {showStar && (
        <>
          {/* The orb itself */}
          <div
            key={isFlying ? "fly" : "awaken"}
            className={[
              "absolute left-1/2 -translate-x-1/2",
              isFlying ? "animate-cast-fly" : "animate-cast-awaken",
            ].join(" ")}
            style={{ top: "63vh", zIndex: 30 }}
          >
            <StarOrb color={activeColor} size={140} float={false} />
          </div>

          {/* Emotion emoji floats just below the orb */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none text-4xl leading-none transition-opacity duration-300"
            style={{
              top: "calc(63vh + 152px)",
              zIndex: 30,
              opacity: isFlying ? 0 : 1,
            }}
          >
            {activeEmotion.emoji}
          </div>

          {/* Soft hint text during awakening */}
          {isAwakening && (
            <p
              className="font-elegant absolute left-1/2 -translate-x-1/2 animate-reveal text-center text-sm text-foreground/45"
              style={{ top: "calc(63vh + 202px)", zIndex: 30 }}
            >
              Your memory is stirring…
            </p>
          )}
        </>
      )}

      {/* ── Trail of sparkles left behind the flying star ── */}
      {isFlying && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: "63vh", zIndex: 25 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute animate-twinkle rounded-full bg-white"
              style={{
                width: 4 - i * 0.6,
                height: 4 - i * 0.6,
                left: `${48 + (i % 2 === 0 ? 6 : -6)}%`,
                top: `${20 + i * 28}%`,
                animationDelay: `${i * 0.18}s`,
                opacity: 0.7,
                boxShadow: `0 0 6px ${activeColor}`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Success text — appears in celebrating phase ── */}
      {showText && (
        <div
          className="absolute left-1/2 w-full max-w-md -translate-x-1/2 px-6 text-center"
          style={{ top: "calc(13vh + 290px)", zIndex: 20 }}
        >
          {/* Emotion emoji large */}
          <p
            className="animate-cast-celebrate text-5xl leading-none"
            style={{ animationDelay: "0s" }}
          >
            {activeEmotion.emoji}
          </p>

          <h1
            className="font-display animate-cast-celebrate mt-5 text-5xl text-primary text-glow sm:text-6xl"
            style={{ animationDelay: "0.18s" }}
          >
            Star cast! ✨
          </h1>

          <p
            className="font-elegant animate-cast-celebrate mt-3 text-xl text-foreground/70"
            style={{ animationDelay: "0.36s" }}
          >
            "{title}" is now glowing in your jar.
          </p>

          <p
            className="font-elegant animate-cast-celebrate mt-2 text-sm text-foreground/40"
            style={{ animationDelay: "0.54s" }}
          >
            Taking you there…
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page shell ────────────────────────────────────────────────────────────────

function AddStarPage() {
  const navigate = useNavigate();
  const create = useCreateStar();
  const { allowed, max, reason, isLoading: limitLoading } = useStarLimit();

  const [step, setStep]         = useState<1 | 2 | 3 | 4>(1);
  const [emotion, setEmotion]   = useState("love");
  const [color, setColor]       = useState<StarColor>("gold");
  const [title, setTitle]       = useState("");
  const [note, setNote]         = useState("");
  const [starredOn, setStarredOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [castPhase, setCastPhase] = useState<CastPhase>("idle");

  const activeColor   = STAR_COLORS[color];
  const activeEmotion = EMOTIONS.find((e) => e.key === emotion)!;

  const cast = () => {
    if (!title.trim()) {
      toast.error("Give your star a name first");
      return;
    }

    // Kick off the animation sequence immediately
    setCastPhase("awakening");
    setTimeout(() => setCastPhase("flying"),      700);
    setTimeout(() => setCastPhase("absorbed"),   2400);
    setTimeout(() => setCastPhase("celebrating"), 3300);

    // Fire the save at 800 ms (while star is mid-flight) — runs in background
    const savePromise: Promise<void> = new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await create.mutateAsync({
            title:      title.trim(),
            note:       note.trim(),
            color,
            emotion,
            starred_on: starredOn,
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 800);
    });

    // Navigate only after the full animation (5 100 ms) + save resolved
    setTimeout(async () => {
      try {
        await savePromise;
        navigate({ to: "/my-jar" });
      } catch (err) {
        toast.error("Couldn't save this memory", {
          description: (err as Error).message,
        });
        setCastPhase("idle"); // return user to the form
      }
    }, 5100);
  };

  // ── Casting animation overlay ───────────────────────────────────────────────
  if (castPhase !== "idle") {
    return (
      <CastingScene
        activeColor={activeColor}
        activeEmotion={activeEmotion}
        title={title}
        phase={castPhase}
      />
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
          const accent   = EMOTION_ACCENT[e.key] ?? STAR_COLORS.gold;
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

      <div className="mt-10 flex flex-col items-center gap-3">
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

      <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
        {COLOR_KEYS.map((k) => {
          const c        = STAR_COLORS[k];
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

        {title ? (
          <div
            className="glass max-w-[210px] rounded-2xl px-5 py-3 text-center transition-all"
            style={{ boxShadow: `0 0 30px ${activeColor}28` }}
          >
            <p className="font-display text-xl text-primary text-glow line-clamp-2 leading-snug">
              {title}
            </p>
          </div>
        ) : (
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
          <span className="text-xs uppercase tracking-widest text-foreground/65">Title</span>
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
          <span className="text-xs uppercase tracking-widest text-foreground/65">Memory</span>
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

      {/* Star + emotion */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <StarOrb color={activeColor} size={200} />
        <p className="text-5xl leading-none">{activeEmotion.emoji}</p>
      </div>

      {/* Memory preview card */}
      <div
        className="glass mt-8 rounded-3xl p-7 text-left"
        style={{ boxShadow: `0 0 40px ${activeColor}1a` }}
      >
        <h2 className="font-display text-3xl text-primary text-glow leading-snug">{title}</h2>
        {note && (
          <p className="font-elegant mt-3 text-base leading-relaxed text-foreground/78">{note}</p>
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
