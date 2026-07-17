import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import { CozyRoom } from "@/components/galaxy/CozyRoom";
import { Header } from "@/components/galaxy/Header";
import { MusicPlayer } from "@/components/galaxy/MusicPlayer";
import { ThemeBoot } from "@/components/galaxy/ThemeBoot";
import { MemoryJar } from "@/components/galaxy/MemoryJar";
import { useStars } from "@/hooks/useGalaxyData";
import type { Star } from "@/hooks/useGalaxyData";
import { STAR_COLORS, type StarColor, EMOTIONS } from "@/lib/galaxy";
import bunnyHer from "@/assets/bunny-her-pixel.png";
import bunnyHim from "@/assets/bunny-him-pixel.png";

export const Route = createFileRoute("/_authenticated/my-jar")({
  head: () => ({
    meta: [
      { title: "My Jar — Our Little Galaxy" },
      { name: "description", content: "All your memories, gathered as glowing stars in one jar." },
    ],
  }),
  component: MyJarPage,
});

// ─── Glow level from star count ────────────────────────────────────────────────

function getGlowLevel(count: number): number {
  if (count <= 0)  return 0;
  if (count <= 3)  return 1;
  if (count <= 7)  return 2;
  if (count <= 11) return 3;
  return 4;
}

// ─── Static lookup tables (no Math.random — SSR-safe) ──────────────────────────

const COLOR_LABELS: Record<StarColor, string> = {
  gold:   "Golden Glow",
  rose:   "Rose Blush",
  sky:    "Sky Blue",
  sage:   "Sage Green",
  blush:  "Soft Blush",
  violet: "Violet Dream",
};

// Deterministic twinkle dots for orbit orbs (shared positions, scaled per orb size)
const TWINKLE_DOTS = [
  { top: 18, left: 22, delay: 0.0 },
  { top: 65, left: 70, delay: 0.7 },
  { top: 78, left: 38, delay: 1.4 },
  { top: 25, left: 75, delay: 2.1 },
];

// Deterministic orbit sizes (px) and float-animation delays (s)
const ORBIT_SIZES  = [34, 28, 38, 26, 32, 36, 24, 34, 28, 38, 26, 32];
const FLOAT_DELAYS = [0.0, 1.3, 0.5, 2.1, 0.9, 1.7, 0.3, 2.5, 1.1, 1.6, 0.7, 2.3];

/**
 * Compute (left%, top%) for orbit star `i` of `total`.
 * Alternates slightly inner/outer radius for an organic feel.
 */
function getOrbitPos(i: number, total: number) {
  const angle = (2 * Math.PI * i) / Math.max(total, 1) - Math.PI / 2 + 0.35;
  const jitter = i % 2 === 0 ? 1.0 : 0.88; // alternate inner/outer ring
  const rx = 41 * jitter;
  const ry = 33 * jitter;
  return {
    left: `${50 + rx * Math.cos(angle)}%`,
    top:  `${49 + ry * Math.sin(angle)}%`,
  };
}

// ─── StarOrb ───────────────────────────────────────────────────────────────────

// Orbit star float-animation variants — cycled by star index for organic variety
const FLOAT_ANIMS = ["animate-float-y", "animate-float-y-b", "animate-float-y-c"] as const;

/**
 * Glowing, floating star orb used in both the jar orbit and the modal preview.
 */
function StarOrb({
  color,
  size = 32,
  delay = 0,
  float = true,
  floatClass = "animate-float-y",
  onClick,
}: {
  color: string;
  size?: number;
  delay?: number;
  float?: boolean;
  floatClass?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { onClick, "aria-label": "Open memory" } : {})}
      className={[
        "rounded-full",
        float ? floatClass : "",
        onClick ? "cursor-pointer transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" : "",
      ].join(" ")}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
        background: `radial-gradient(circle at 38% 32%, white 0%, ${color} 38%, ${color}88 80%)`,
        boxShadow: [
          `0 0 ${Math.round(size * 0.5)}px ${color}`,
          `0 0 ${Math.round(size * 1.1)}px ${color}55`,
          `0 0 ${Math.round(size * 2.0)}px ${color}22`,
        ].join(", "),
        position: "relative",
        flexShrink: 0,
      }}
    >
      {TWINKLE_DOTS.map((d, k) => (
        <span
          key={k}
          className="absolute animate-twinkle rounded-full bg-white pointer-events-none"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: Math.max(1, size * 0.065),
            height: Math.max(1, size * 0.065),
            animationDelay: `${d.delay}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </Tag>
  );
}

// ─── Bunny celebration ─────────────────────────────────────────────────────────

// Deterministic particle set — no Math.random, SSR-safe.
// --cpx drives per-particle horizontal drift (set as inline CSS var).
const CELEBRATE_PARTICLES = [
  { cpx: "-14px", delay: 0.00, symbol: "♥", color: "oklch(0.82 0.15 8)"   },
  { cpx:  "16px", delay: 0.12, symbol: "✦", color: "oklch(0.92 0.16 90)"  },
  { cpx:  "-7px", delay: 0.24, symbol: "♥", color: "oklch(0.88 0.13 350)" },
  { cpx:  "22px", delay: 0.08, symbol: "✦", color: "oklch(0.85 0.10 240)" },
  { cpx: "-20px", delay: 0.32, symbol: "♥", color: "oklch(0.86 0.13 82)"  },
  { cpx:   "8px", delay: 0.18, symbol: "✦", color: "oklch(0.87 0.11 290)" },
] as const;

/**
 * Bunny sprite that idles normally and does a one-shot joyful jump (with
 * floating hearts/sparkles + a temporary pixel-art happy face overlay) whenever
 * `isArriving` flips to true.
 *
 * The sprite image is NEVER modified — only CSS transforms and a layered SVG
 * overlay are applied. The face sits on the back of the head (both sprites face
 * away from the viewer), which is a classic chibi 4th-wall trope.
 *
 * eyeColor  — stroke colour for the ∩ happy-eye arcs (contrasts with fur)
 * noseColor — fill colour for the tiny nose dot
 */
function BunnyReaction({
  src,
  side,
  isArriving,
  idleClass,
  eyeColor,
  noseColor,
}: {
  src: string;
  side: "left" | "right";
  isArriving: boolean;
  idleClass: string;
  eyeColor: string;
  noseColor: string;
}) {
  const jumpClass =
    side === "left" ? "animate-bunny-happy-jump" : "animate-bunny-happy-jump-r";

  return (
    <div
      className="pointer-events-none absolute select-none"
      style={{
        [side]: "3%",
        bottom: "5%",
        width: "clamp(50px, 9%, 72px)",
        zIndex: 5,
      }}
    >
      {/* Floating hearts & sparkles — only rendered during arrival */}
      {isArriving && CELEBRATE_PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-bunny-celebrate absolute left-1/2 bottom-full -translate-x-1/2"
          style={{
            "--cpx": p.cpx,
            animationDelay: `${p.delay}s`,
            fontSize: "clamp(9px, 1.4vw, 14px)",
            color: p.color,
            lineHeight: 1,
            filter:    `drop-shadow(0 0 3px ${p.color})`,
            textShadow: `0 0 6px ${p.color}`,
            whiteSpace: "nowrap",
          } as React.CSSProperties}
        >
          {p.symbol}
        </span>
      ))}

      {/* Bunny sprite — same asset as dashboard, only animation class changes */}
      <img
        src={src}
        alt=""
        aria-hidden
        className={isArriving ? jumpClass : idleClass}
        style={{
          imageRendering: "pixelated",
          width: "100%",
          filter: [
            "drop-shadow(2px 2px 0px oklch(0.08 0.03 255 / 0.75))",
            "drop-shadow(0 0 14px oklch(0.90 0.15 78 / 0.42))",
            "drop-shadow(0 0 6px oklch(0.74 0.09 8 / 0.22))",
          ].join(" "),
        }}
      />

      {/*
        ── Happy face overlay ──────────────────────────────────────────────────
        Positioned over the back of the head (both sprites face away).
        top 29% ≈ the round head centre in the 1:1 sprite canvas.
        A tiny SVG draws two ∩ closed-arc eyes + a dot nose, pixel-art style.
        React unmounts it when isArriving → false, so it never shows at idle.
      */}
      {isArriving && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "29%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "44%",
            zIndex: 10,
          }}
        >
          <svg
            className="animate-bunny-face w-full"
            viewBox="0 0 14 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            {/* Left happy eye — ∩ arc */}
            <path
              d="M1 6 Q3.5 2.5 6 6"
              stroke={eyeColor}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            {/* Right happy eye — ∩ arc */}
            <path
              d="M8 6 Q10.5 2.5 13 6"
              stroke={eyeColor}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            {/* Tiny nose */}
            <circle cx="7" cy="8.4" r="1.05" fill={noseColor} />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Jar scene ─────────────────────────────────────────────────────────────────

/**
 * The centrepiece: MemoryJar floating in the middle, user stars orbiting around it.
 * Stars in the upper arc render behind the jar; lower arc renders in front — giving
 * a pseudo-3D orbital feel.
 */
function JarScene({
  stars,
  onStarClick,
  glowLevel,
  isArriving,
}: {
  stars: Star[];
  onStarClick: (s: Star) => void;
  glowLevel: number;
  isArriving: boolean;
}) {
  const total = stars.length;

  return (
    <div
      className="relative mx-auto w-full select-none"
      style={{ maxWidth: 680, aspectRatio: "680 / 520" }}
    >
      {/* Ambient glow behind the whole scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-pulse-glow"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 52%, oklch(0.80 0.14 280 / 0.22), transparent 70%)",
        }}
      />

      {/* Jar — z-10 so lower-arc stars (z-20) render in front */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-jar-enter"
        style={{ zIndex: 10, animationDelay: "0.1s" }}
      >
        {/* Arrival bloom — radiates outward when a new star lands */}
        {isArriving && (
          <div
            aria-hidden
            className="pointer-events-none absolute animate-jar-bloom rounded-full"
            style={{
              inset: "-22%",
              background:
                "radial-gradient(circle, oklch(0.92 0.16 90 / 0.75), oklch(0.84 0.13 320 / 0.45) 42%, transparent 68%)",
              filter: "blur(18px)",
              zIndex: -1,
            }}
          />
        )}

        {/* Pulse wrapper — bounces the whole jar on arrival */}
        <div className={isArriving ? "animate-jar-arrival" : undefined}>
          <MemoryJar size={230} glowLevel={glowLevel} />
        </div>
      </div>

      {/* ── Bunny reactions — flank the jar, jump when a star arrives ── */}
      {/* Her (white fur): dark-brown eyes contrast on cream, pink nose matches inner ears */}
      <BunnyReaction
        src={bunnyHer}
        side="left"
        isArriving={isArriving}
        idleClass="animate-bunny-idle"
        eyeColor="#3d1505"
        noseColor="#e8909a"
      />
      {/* Him (dark-brown fur): warm-cream eyes visible on dark fur, tan nose */}
      <BunnyReaction
        src={bunnyHim}
        side="right"
        isArriving={isArriving}
        idleClass="animate-bunny-idle-r"
        eyeColor="#f2ddb8"
        noseColor="#c8987a"
      />

      {/* Orbiting stars */}
      {stars.map((s, i) => {
        const pos = getOrbitPos(i, total);
        const color = STAR_COLORS[s.color as StarColor] ?? STAR_COLORS.gold;
        const orbSize = ORBIT_SIZES[i % ORBIT_SIZES.length];
        const delay = FLOAT_DELAYS[i % FLOAT_DELAYS.length];
        // Stars in lower half of orbit are "in front" of the jar
        const topPct = parseFloat(pos.top);
        const zIndex = topPct >= 49 ? 20 : 8;
        // Stagger entrance: first star at 0.22s, each subsequent +0.06s
        const enterDelay = (0.22 + i * 0.06).toFixed(2);

        return (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -50%)",
              zIndex,
            }}
          >
            {/* Entrance wrapper — pops in on mount, then hands off to the float animation */}
            <div
              className="animate-orbit-star-enter"
              style={{ animationDelay: `${enterDelay}s` }}
            >
              <StarOrb
                color={color}
                size={orbSize}
                delay={delay}
                floatClass={FLOAT_ANIMS[i % FLOAT_ANIMS.length]}
                onClick={() => onStarClick(s)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Memory list card ──────────────────────────────────────────────────────────

function MemoryCard({
  star,
  index,
  onClick,
}: {
  star: Star;
  index: number;
  onClick: () => void;
}) {
  const color = STAR_COLORS[star.color as StarColor] ?? STAR_COLORS.gold;
  const emotion = EMOTIONS.find((e) => e.key === star.emotion);
  const date = new Date(star.starred_on + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="glass w-full rounded-3xl p-6 text-left transition hover:scale-[1.02] hover:bg-white/10 animate-reveal group"
      style={{ animationDelay: `${Math.min(index, 12) * 0.045}s` }}
    >
      <div className="flex items-center gap-4">
        {/* Mini orb */}
        <div
          className="shrink-0 rounded-full transition group-hover:scale-110"
          style={{
            width: 46,
            height: 46,
            background: `radial-gradient(circle at 38% 32%, white 0%, ${color} 40%, ${color}88 100%)`,
            boxShadow: `0 0 18px ${color}88, 0 0 36px ${color}33`,
          }}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-2xl text-primary text-glow">
            {star.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {emotion && (
              <span className="text-sm text-foreground/60">
                {emotion.emoji} {emotion.label}
              </span>
            )}
            <span className="text-xs text-foreground/35">·</span>
            <span className="font-elegant text-sm text-foreground/50">{date}</span>
          </div>
        </div>

        <Sparkles className="h-4 w-4 shrink-0 text-primary/40 transition group-hover:text-primary/80" />
      </div>

      {star.note && (
        <p className="font-elegant mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/65">
          {star.note}
        </p>
      )}
    </button>
  );
}

// ─── Star detail modal ─────────────────────────────────────────────────────────

function StarDetailModal({
  star,
  onClose,
}: {
  star: Star;
  onClose: () => void;
}) {
  const color = STAR_COLORS[star.color as StarColor] ?? STAR_COLORS.gold;
  const colorLabel = COLOR_LABELS[star.color as StarColor] ?? star.color;
  const emotion = EMOTIONS.find((e) => e.key === star.emotion);
  const date = new Date(star.starred_on + "T12:00:00").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{
        background: "oklch(0.08 0.03 270 / 0.78)",
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md animate-reveal glass rounded-3xl p-8"
        style={{
          boxShadow: `0 0 80px ${color}28, 0 32px 80px oklch(0.05 0.02 270 / 0.65)`,
          border: `1px solid ${color}30`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-foreground/55 transition hover:bg-white/20 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Orb + emotion */}
        <div className="flex flex-col items-center">
          <StarOrb color={color} size={110} float={false} />
          {emotion && (
            <p className="mt-4 text-4xl leading-none">{emotion.emoji}</p>
          )}
        </div>

        {/* Title */}
        <h2 className="mt-5 text-center font-display text-3xl text-primary text-glow leading-snug">
          {star.title}
        </h2>

        {/* Chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {emotion && (
            <Chip>{emotion.emoji} {emotion.label}</Chip>
          )}
          <Chip>✨ {colorLabel}</Chip>
          <Chip>📅 {date}</Chip>
        </div>

        {/* Memory message */}
        {star.note ? (
          <>
            <div
              className="my-6 h-px w-full"
              style={{ background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }}
            />
            <p className="font-elegant text-base leading-relaxed text-foreground/82 text-center">
              {star.note}
            </p>
          </>
        ) : (
          <p className="font-elegant mt-6 text-sm text-center text-foreground/38 italic">
            No message written for this star.
          </p>
        )}
      </div>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

function MyJarPage() {
  const { data: stars = [], isLoading } = useStars();
  const [selected, setSelected] = useState<Star | null>(null);
  const [isArriving, setIsArriving] = useState(false);

  // Detect arrival from the cast animation (flag set in add-star before navigate)
  useEffect(() => {
    if (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("jar-new-star") === "1") {
      sessionStorage.removeItem("jar-new-star");
      setIsArriving(true);
      const t = setTimeout(() => setIsArriving(false), 2100);
      return () => clearTimeout(t);
    }
  }, []);

  // Stars shown in the orbit (cap at 12 so the scene isn't cluttered)
  const orbitStars = stars.slice(0, 12);
  // All stars shown in the list below
  const isEmpty = !isLoading && stars.length === 0;
  const glowLevel = getGlowLevel(stars.length);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ThemeBoot />
      <CozyRoom />
      <Header />
      <MusicPlayer />

      <main
        className="relative z-10 mx-auto max-w-4xl px-4 pb-28 sm:px-6"
        style={{ paddingTop: "max(5.5rem, 9vh)" }}
      >

        {/* ── Heading ── */}
        <div className="mb-2 text-center animate-reveal">
          <p className="text-[11px] uppercase tracking-[0.32em] text-primary/70">My Jar</p>
          <h1 className="font-display mt-1 text-5xl text-primary text-glow sm:text-6xl">
            {isEmpty
              ? "Your jar is waiting"
              : `${stars.length} ${stars.length === 1 ? "star" : "stars"} inside`}
          </h1>
          <p className="font-elegant mt-2 text-base text-foreground/55">
            {isEmpty
              ? "Every memory you add will glow here forever."
              : "Tap any star to read its memory."}
          </p>
        </div>

        {/* ── Jar scene ── */}
        {isLoading ? (
          /* Loading: show the jar quietly while data loads */
          <div
            className="flex animate-reveal justify-center"
            style={{ animationDelay: "0.15s" }}
          >
            <MemoryJar size={240} glowLevel={0} />
          </div>
        ) : (
          <div
            className="animate-reveal"
            style={{ animationDelay: "0.15s" }}
          >
            <JarScene
              stars={orbitStars}
              onStarClick={setSelected}
              glowLevel={glowLevel}
              isArriving={isArriving}
            />
          </div>
        )}

        {/* ── Empty state CTA ── */}
        {isEmpty && (
          <div
            className="mt-2 flex justify-center animate-reveal"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              to="/add-star"
              className="font-elegant inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-lg text-primary-foreground shadow-xl transition hover:scale-[1.04]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4 not-italic" /> Add your first star
            </Link>
          </div>
        )}

        {/* ── Memory list ── */}
        {!isLoading && stars.length > 0 && (
          <section
            className="animate-reveal"
            style={{ animationDelay: "0.32s" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-3xl text-primary text-glow">All memories</h2>
              <Link
                to="/add-star"
                className="font-elegant inline-flex items-center gap-2 rounded-full px-5 py-2 text-base text-primary-foreground transition hover:scale-[1.03]"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus className="h-3.5 w-3.5 not-italic" /> Add Star
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {stars.map((s, i) => (
                <MemoryCard
                  key={s.id}
                  star={s}
                  index={i}
                  onClick={() => setSelected(s)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Detail modal ── */}
      {selected && (
        <StarDetailModal
          star={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
