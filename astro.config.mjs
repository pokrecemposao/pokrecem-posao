// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import tailwindcss from "@tailwindcss/vite";

// Glavna adresa stranice (kanonski URL, sitemap, dijeljenje na mrežama).
const SITE = process.env.SITE_URL ?? "https://pokrecemposao.com";

export default defineConfig({
  site: SITE,
  // Javne stranice su statične (gotov HTML). Poslužiteljski rade samo
  // /keystatic i /api/keystatic, koje dodaje Keystatic.
  output: "static",
  adapter: cloudflare({
    // Slike se optimiziraju tijekom builda, ne na Cloudflareu.
    imageService: "compile",
  }),
  integrations: [react(), keystatic()],
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
