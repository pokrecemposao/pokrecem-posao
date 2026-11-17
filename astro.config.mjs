// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Glavna adresa stranice (kanonski URL, sitemap, dijeljenje na mrežama).
const SITE = process.env.SITE_URL ?? "https://pokrecemposao.com";

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
