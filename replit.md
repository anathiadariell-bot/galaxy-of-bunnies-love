# Our Little Galaxy

A premium couples memory SaaS app — a dreamy night-sky themed space for couples to save memories as glowing "stars," write love letters, and track a shared timeline. Originally built with [Lovable](https://lovable.dev) and imported from GitHub.

## Stack

- **Framework**: TanStack Start (React 19) + Vite, SSR via Nitro
- **Styling**: Tailwind CSS v4, Radix UI primitives, shadcn-style components (`src/components/ui`)
- **Backend/Auth/DB**: Supabase (`src/integrations/supabase`), migrations in `supabase/migrations`
- **Package manager**: bun (`bun.lock` is the source of truth; a `package-lock.json` also exists from a prior npm run but isn't used)

## Running the app

- Dev server: `bun run dev` (bound to `0.0.0.0:5000`, configured in `vite.config.ts` for the Replit preview proxy — `allowedHosts: true`, `strictPort: true`)
- The "Start application" workflow runs this automatically.
- Build: `bun run build` (outputs to `.output/`, targets Cloudflare Workers via nitro by default — not currently deployed that way, just the default build target from the Lovable config)

## Environment

Supabase credentials live in `.env` (committed — these are publishable/anon-scoped keys, not secrets): `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY`, and `VITE_`-prefixed equivalents for the client bundle.

## Notes

- `src/routes/__root.tsx`'s SSR shell renders a `data-tsd-source` debug attribute (from Lovable's own dev-tooling plugin, inside `node_modules`) that differs between server/client line offsets in dev mode, producing a harmless hydration-mismatch console error on first load. It's cosmetic — pages render correctly — and isn't something to "fix" since it's vendor tooling, not app code.
- Fixed a real hydration bug in `src/components/galaxy/NightSky.tsx`: star/firefly positions were computed with `Math.random()` during render, so SSR and client produced different values and React discarded/rebuilt the whole tree on every page load. Now generated client-side only, after mount.

## User preferences

- Keep the existing visual design and brand identity as-is; only fix functional issues, don't redesign.
