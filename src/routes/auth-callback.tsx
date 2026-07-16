import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NightSky } from "@/components/galaxy/NightSky";

// This route receives the OAuth redirect from Supabase after the provider
// (e.g. Google) authenticates the user.  Supabase appends either:
//   - ?code=XXXX  (PKCE flow, default in supabase-js v2)
//   - #access_token=XXX&refresh_token=XXX  (implicit flow, legacy)
//
// The Supabase client automatically detects and exchanges whichever form is
// present (detectSessionInUrl: true by default) when it initialises.  We
// just wait for the resulting SIGNED_IN event before navigating away.
//
// This is a flat top-level route (not nested under /auth) so it has no
// _authenticated wrapper and beforeLoad never fires before the code exchange
// completes.

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // ── TEMPORARY DIAGNOSTICS — remove after debugging ──────────────────────
    console.error('[auth-callback] URL on mount:', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    console.error('[auth-callback] ?code present:', urlParams.has('code'));
    console.error('[auth-callback] ?error:', urlParams.get('error'));
    console.error('[auth-callback] ?error_description:', urlParams.get('error_description'));
    console.error('[auth-callback] code-verifier in localStorage:',
      localStorage.getItem('supabase.auth.token-code-verifier'));

    // Explicitly call exchangeCodeForSession to surface the exact error.
    const code = urlParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        console.error('[auth-callback] exchangeCodeForSession result — error:', error, 'session:', data?.session?.user?.email ?? null);
      });
    }
    // ── END TEMPORARY DIAGNOSTICS ────────────────────────────────────────────

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth-callback] onAuthStateChange event:', event, 'has session:', !!session);
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        // SIGNED_IN  — normal path: code exchange completed after we subscribed.
        // INITIAL_SESSION with a session — code exchange completed before we
        //   subscribed (root layout registered its listener first); supabase-js
        //   won't re-fire SIGNED_IN, so we catch the already-valid session here.
        subscription.unsubscribe();
        clearTimeout(timeout);
        navigate({ to: "/dashboard", replace: true });
      } else if (event === "SIGNED_OUT") {
        // Explicit sign-out during the callback — something went wrong.
        subscription.unsubscribe();
        clearTimeout(timeout);
        navigate({ to: "/auth", replace: true });
      }
      // INITIAL_SESSION with null is normal while the PKCE code is being exchanged.
      // Do NOT redirect here — wait for SIGNED_IN or the safety-net timeout below.
    });

    // Safety net: if no auth event fires within 8 s, fall back to login.
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      navigate({ to: "/auth", replace: true });
    }, 8000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NightSky />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="glass rounded-3xl px-10 py-8 text-center">
          <p className="font-display text-2xl text-primary text-glow">
            Opening your galaxy…
          </p>
          <p className="mt-2 text-sm text-foreground/60">
            Just a moment while we connect the stars.
          </p>
        </div>
      </div>
    </div>
  );
}
