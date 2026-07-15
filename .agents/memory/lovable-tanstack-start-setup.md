---
name: Lovable/TanStack Start setup on Replit
description: How to get a Lovable-generated TanStack Start + Vite + Supabase project running in Replit's preview, and a known cosmetic dev-mode error to expect.
---

Projects built with Lovable (lovable.dev) and imported via GitHub use `@lovable.dev/vite-tanstack-config`'s `defineConfig`, which hardcodes the dev server to `host: "::", port: 8080` unless a sandbox env var is set. Replit's preview proxy requires the app on `0.0.0.0:5000` with `allowedHosts: true`.

**How to apply:** pass `vite: { server: { host: "0.0.0.0", port: 5000, strictPort: true, allowedHosts: true } }` into the `defineConfig({...})` call in `vite.config.ts` — the library's `mergeConfig` lets caller-supplied server options win over its defaults when not in "sandbox mode".

These projects use `bun` (there's a `bun.lock` and `bunfig.toml`) even though a stray `package-lock.json` may also exist from an earlier `npm install` — prefer `bun install` / `bun run dev`. Note: `bun` and `node` may not be on `$PATH` in every fresh shell in this environment; if `bun: command not found`, retry with the full path from `which bun` in a working shell, or just re-run — it's usually transient.

**Known non-issue:** in dev mode, the root `<html>`/`<head>` elements get a `data-tsd-source="path:line:col"` attribute from Lovable's own dev-tooling plugin (lives in `node_modules`, not app code), and the client-computed line number can disagree with the server-computed one, printing a hydration-mismatch console error on first load even on a clean import with no app bugs. Purely cosmetic — the page still renders correctly. Don't spend time chasing it; it's not app code and not fixable without patching vendor tooling.

A real, fixable version of this same class of bug: any component that calls `Math.random()` (or `Date.now()`, locale-dependent formatting, etc.) directly during render for SSR-visible output will hydrate-mismatch for real — the server and client each roll different values. Fix by moving the random generation into `useEffect` + `useState` (client-only), not `useMemo` (which still runs during SSR).
