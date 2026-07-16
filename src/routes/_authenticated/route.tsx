// This file gates all routes under src/routes/_authenticated/*.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() reads from localStorage — no network call, never fails transiently.
    // getUser() (network round-trip) was here before and caused two bugs:
    //   1. Any transient failure kicked logged-in users back to /auth.
    //   2. The OAuth callback race: beforeLoad ran before Supabase could exchange
    //      the PKCE code for tokens, so getUser() returned null and redirected to /auth.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth" });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
