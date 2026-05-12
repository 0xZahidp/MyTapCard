// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Vercel uses Nitro's Node server output. The Cloudflare plugin is disabled here so
// the production build emits .output/server/index.mjs for Vercel to run.
export default defineConfig({
  cloudflare: false,
  plugins: [nitro({ preset: "vercel" })],
  tanstackStart: {
    server: { entry: "server" },
  },
});
