import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** Базовый путь для GitHub Pages: `/repo/` или `/` для user-site */
function normalizeBase(raw: string | undefined): string {
  let b = (raw ?? "/").trim();
  if (b === "" || b === ".") b = "/";
  if (!b.startsWith("/")) b = `/${b}`;
  if (!b.endsWith("/")) b += "/";
  return b;
}

export default defineConfig({
  root: ".",
  base: normalizeBase(process.env.VITE_BASE_PATH),
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Экзамен: методы в экономике",
        short_name: "Angl-en",
        description: "Подготовка к закрытому тесту",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        lang: "ru",
        start_url: "./",
        icons: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2}"],
      },
    }),
  ],
});
