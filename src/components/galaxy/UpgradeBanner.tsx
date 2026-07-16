import { Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  message: string;
  /** Optional extra class names on the outer wrapper */
  className?: string;
}

/**
 * Shown when the user has hit a Free-plan limit.
 * Displays the limit message and a (currently inert) upgrade CTA.
 * When payments are wired in, replace the onClick with the checkout flow.
 */
export function UpgradeBanner({ message, className = "" }: UpgradeBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/10 to-transparent p-5 ${className}`}
    >
      {/* decorative glow blob */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">{message}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            // TODO: open payment / upgrade flow
            import("sonner").then(({ toast }) =>
              toast("Premium is coming soon! ✨", {
                description: "We're adding payments shortly. Stay tuned.",
              }),
            );
          }}
          className="shrink-0 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-[1.04] active:scale-[0.97]"
          style={{ background: "var(--gradient-primary)" }}
        >
          Upgrade to Premium ✨
        </button>
      </div>
    </div>
  );
}
