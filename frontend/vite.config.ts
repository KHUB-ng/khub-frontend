import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "/khub-frontend/",
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          // Only chunk packages that are actually installed: the previous
          // list named paystack, react-i18next and chart.js, none of which
          // are in package.json, so `vite build` could not resolve them.
          ui: ["react-hook-form"],
          maps: ["leaflet", "react-leaflet"],
        },
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    // Dev proxy: the Rust backend hardcodes CORS to the khub.com.ng origins,
    // so a localhost page is rejected on a direct call. Proxying /api through
    // the dev server sidesteps CORS with zero backend changes.
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET ?? "https://api.khub.com.ng",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
      "/files": {
        target: process.env.VITE_API_TARGET ?? "https://api.khub.com.ng",
        changeOrigin: true,
      },
    },
  },
});
