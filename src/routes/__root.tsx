import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-7xl text-primary text-glow">404</h1>
        <p className="mt-4 text-lg text-foreground/80">This star has drifted out of our little galaxy.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-3xl text-primary">A cloud passed by</h1>
        <p className="mt-3 text-sm text-foreground/70">Something dimmed the stars. Try again in a moment.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Our Little Galaxy — Every memory becomes a star" },
      { name: "description", content: "A dreamy space for couples to save memories as glowing stars in their own galaxy. Photos, voice notes, love letters, and a shared timeline." },
      { name: "author", content: "Our Little Galaxy" },
      { property: "og:title", content: "Our Little Galaxy — Every memory becomes a star" },
      { property: "og:description", content: "A dreamy space for couples to save memories as glowing stars in their own galaxy. Photos, voice notes, love letters, and a shared timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Our Little Galaxy — Every memory becomes a star" },
      { name: "twitter:description", content: "A dreamy space for couples to save memories as glowing stars in their own galaxy. Photos, voice notes, love letters, and a shared timeline." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93d95083-39e5-4414-a846-2f08b46e5582/id-preview-62eb9fd9--424c1ac0-c608-435a-b542-f9613fa09760.lovable.app-1784065726801.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93d95083-39e5-4414-a846-2f08b46e5582/id-preview-62eb9fd9--424c1ac0-c608-435a-b542-f9613fa09760.lovable.app-1784065726801.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Invalidate the router so beforeLoad re-runs and kicks the user off protected routes.
        router.invalidate();
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Refresh server state without re-running beforeLoad.
        // Navigation after sign-in is handled by auth.tsx and auth/callback.tsx directly.
        queryClient.invalidateQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
