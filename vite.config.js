import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Keep the production server bundle self-contained for the published site.
  // Disabling this causes runtime-only imports like h3-v2 to be missing live.
  nitro: true,
  vite: {
    base: "/",
    build: {
      outDir: "dist",
    },
  },
});
