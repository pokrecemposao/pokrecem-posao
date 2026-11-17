// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Privremena adresa dok se ne spoji vlastita domena.
const SITE = process.env.SITE_URL ?? "https://pokrecem-posao.pages.dev";

export default defineConfig({
  site: SITE,
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
