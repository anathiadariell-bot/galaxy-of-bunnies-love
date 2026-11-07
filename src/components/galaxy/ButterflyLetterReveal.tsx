import butterflySpriteSheet from "@/assets/butterfly-pixel-sheet.png";
import { MemoryJar } from "@/components/galaxy/MemoryJar";

const BUTTERFLIES = [
  { color: "pink", flight: "northwest" },
  { color: "gold", flight: "northeast" },
  { color: "lavender", flight: "west" },
  { color: "mint", flight: "east" },
  { color: "pink", flight: "southwest" },
  { color: "gold", flight: "southeast" },
] as const;

export function ButterflyLetterReveal() {
  return (
    <div
      className="letter-reveal-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-reveal-title"
    >
      <div className="letter-reveal-bloom absolute left-1/2 top-1/2" aria-hidden="true" />

      <div className="letter-reveal-stage relative flex h-full w-full items-center justify-center">
        <div className="letter-reveal-jar relative z-10">
          <MemoryJar size={260} glowLevel={3} />
        </div>

        {BUTTERFLIES.map(({ color, flight }, index) => (
          <span
            key={`${color}-${flight}`}
            className={`letter-reveal-butterfly letter-reveal-flight--${flight}`}
            aria-hidden="true"
            style={{ animationDelay: `${0.82 + index * 0.11}s` }}
          >
            <span
              className={`letter-reveal-butterfly-sprite letter-reveal-sprite--${color}`}
              style={{ backgroundImage: `url("${butterflySpriteSheet}")` }}
            />
          </span>
        ))}

        <div className="letter-reveal-caption absolute inset-x-4 text-center">
          <h2 id="letter-reveal-title" className="font-display text-2xl text-primary text-glow">
            Your letter is ready
          </h2>
          <p className="font-elegant mt-2 text-sm text-foreground/75">
            The words you saved for this day.
          </p>
        </div>
      </div>
    </div>
  );
}
