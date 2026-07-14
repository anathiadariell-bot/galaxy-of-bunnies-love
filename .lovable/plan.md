## Goal
Refine the homepage hero so the bunnies, jar, moon and sky read as one cinematic scene — bunnies guarding the galaxy jar, jar smaller and better balanced, unified lighting throughout.

## Changes (frontend only)

### 1. `src/routes/index.tsx` — hero composition
- Wrap jar + bunnies in a single relative "scene" container so they scale/position together instead of being spread across the hero.
- Reduce jar wrapper max-width (roughly from ~28rem to ~20rem on desktop, proportionally smaller on tablet/mobile) so it no longer dominates.
- Reposition bunnies from the far edges to just beside the jar base:
  - White bunny (her): bottom-left of the jar, slightly overlapping the jar's base, looking up toward it.
  - Brown bunny (him): bottom-right of the jar, mirrored, also angled toward the jar.
  - Use `absolute` inside the scene container with percentage offsets so they stay glued to the jar across breakpoints.
- Add generous vertical padding above/below the scene so the jar has breathing room; keep it as the clear focal point.
- Mobile: stack sizing down; bunnies remain flanking the jar (not hidden), just smaller.

### 2. Cohesive cinematic lighting
In `src/routes/index.tsx` / `src/components/galaxy/MemoryJar.tsx` / bunny elements:
- Add a shared warm-gold ground glow (radial gradient) beneath the jar that also bathes the bunnies — single light source tying them together.
- Apply matching `drop-shadow` filters to bunnies using the jar's glow color (soft gold/blue rim) so they appear lit by the jar.
- Add subtle contact shadows (soft dark ellipses) under jar and both bunnies on the same ground plane.
- Slightly desaturate/cool the bunnies via a small `filter: brightness/contrast/hue-rotate` tune so they match the night-sky palette instead of looking pasted on.
- Ensure the moon glow, jar glow and ground glow share the same hue family (already in the token set — reuse existing `--primary-glow` / accent tokens, no new colors).

### 3. Micro-polish
- Gentle idle animation: bunnies get a very slow breathing/sway (`animate-float` variant with longer duration and small amplitude), synchronized with the jar's float so the scene feels alive but calm.
- Ensure z-index order: sky < moon < clouds < ground glow < jar halo < jar < bunnies (front bunny paws slightly overlap jar base) < particles/fireflies foreground.

## Out of scope
- No changes to auth, dashboard, routing, backend, or assets themselves (reusing existing jar/bunny/moon PNGs).
- No new dependencies.

## Verification
- Visual check at desktop (1280), tablet (~768), mobile (360) via preview screenshots; confirm jar centered, bunnies flanking and touching jar base, unified glow, nothing clipped.
