import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/fitness/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icons/icon-192.svg",
        "icons/icon-512.svg",
        "icons/icon-maskable.svg",
      ],
      manifest: {
        name: "WLD Fitness",
        short_name: "WLD Fit",
        description: "Training, Fortschritt und Ernährung in einer App.",
        theme_color: "#05090f",
        background_color: "#05090f",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/fitness/",
        start_url: "/fitness/",
        lang: "de-CH",
        categories: ["fitness", "health", "sports"],
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "icons/icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/fitness/index.html",
        globPatterns: ["**/*.{js,css,html,svg,jpeg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/fitness/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "wld-fitness-assets",
              expiration: { maxEntries: 80, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "../fitness",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
