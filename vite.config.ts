// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Replit's preview proxy serves the app on port 5000 from an iframe on a
  // different origin, so the dev server must bind 0.0.0.0:5000 and accept any host.
  vite: {
    // Bake the Replit external dev domain in at Vite startup so client code can
    // build correct OAuth redirectTo URLs even when the page is loaded from the
    // editor's internal preview iframe (whose origin differs from the real URL).
    // Outside Replit, REPLIT_DEV_DOMAIN is absent → empty string → code falls
    // back to window.location.origin, which is correct everywhere else.
    define: {
      "import.meta.env.VITE_REPLIT_DEV_ORIGIN": JSON.stringify(
        process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : ""
      ),
    },
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
    },
  },
});
