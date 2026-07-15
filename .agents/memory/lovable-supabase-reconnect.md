---
name: Reconnecting a Lovable-imported app to a user-owned Supabase project
description: How to detect a Lovable-managed (not user-owned) Supabase backend, and how to actually connect from Replit once the user provisions their own project.
---

Lovable-built apps auto-provision a Supabase project that Lovable's own account manages, not the user's. Symptom: the user can never find the project ID from `.env`/`VITE_SUPABASE_URL` anywhere in their own Supabase dashboard, and dashboard settings changes never take effect on the live API (verify by polling `GET {url}/auth/v1/settings` after a change — if it never reflects the edit, the user is editing a different project than the one in `.env`). Fix: have the user create their own Supabase project and migrate to it.

**How to apply:** once the user gives a new project's URL + anon key (as secrets, e.g. `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), check the exact env var *names* the app's generated Supabase client files expect (Lovable codegen typically wants `VITE_SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_PUBLISHABLE_KEY`, not `ANON_KEY`) — a naming mismatch silently leaves the old project's stale non-secret `.env` value in effect for any name the new secret doesn't cover. Rewrite `.env` (values piped from the new secrets via shell, never printed) using the exact legacy names so no code edits are needed, and update `supabase/config.toml`'s `project_id` too.

**Running SQL migrations against the new project:** Supabase's *direct* connection host (`db.<ref>.supabase.co:5432`) is IPv6-only and unreachable from Replit. Use the pooler host instead (`aws-0-<region>.pooler.supabase.com:6543`, username `postgres.<project-ref>`) — but if `psql` still gets "password authentication failed" after a fresh password reset, don't keep retrying blind; it's faster and just as correct to hand the user the consolidated migration SQL and have them run it once in the Supabase dashboard's own SQL Editor, which has no networking/password failure mode at all.

**Tooling pitfall:** `AskQuestion`'s text field is a normal (non-secure) chat form — a user asked to paste a password/connection string there will have it echoed in plain chat history. Only `requestSecrets` (via CodeExecution) opens the actual secure secret-entry UI; use that specifically whenever the value is a password/token/connection string, even for a quick follow-up re-ask.

Verify the reconnect end-to-end with direct `curl` against the new project's Auth/REST API (signup → session → insert into RLS-protected tables with the returned JWT) rather than trusting the UI alone — it's the fastest way to confirm schema + RLS + trigger all landed correctly.
