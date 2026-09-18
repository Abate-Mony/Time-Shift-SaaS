import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mkcert(),
    VitePWA({
      registerType: "autoUpdate",
      // Custom service worker (push + notificationclick handlers) lives at
      // src/sw.ts. injectManifest builds that file and injects the Workbox
      // precache list into it, instead of generateSW's default of writing
      // its own sw.js from scratch — which would silently overwrite the
      // push-notification handlers with a precache-only worker.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // Keep the precache list small — this app doesn't need full offline
        // support, just enough for install/updates plus the push handlers.
        globPatterns: ["index.html"],
      },
      // Lets `npm run dev` serve/register src/sw.ts as-is (precache list is
      // just empty in this mode) so push notifications can be tested against
      // the dev server directly, without a full `build` + `preview` cycle.
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "INPRN",
        short_name: "INPRN",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          // TODO: replace with real 192x192 / 512x512 PNG icons once
          // available — favicon.svg is a placeholder so the manifest
          // doesn't reference a 404ing file in the meantime.
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Splits the single ~2.4MB app bundle into cacheable vendor chunks
        // instead of one giant file every visitor has to re-download on
        // every deploy. Grouped by how often each library actually changes/
        // is needed, not just alphabetically — react/react-dom essentially
        // never change between deploys, recharts is only pulled in by a
        // handful of chart-heavy pages, etc.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/](react|react-dom|react-router)[\\/]/.test(id)) return "vendor-react";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@tanstack")) return "vendor-query";
          return "vendor";
        },
      },
    },
  },
});