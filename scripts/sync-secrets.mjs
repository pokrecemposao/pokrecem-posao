/**
 * Prenosi ključeve za admin iz Cloudflare "Build → Variables and secrets"
 * u tajne Workera (koje admin čita dok stranica radi).
 *
 * Zašto: Cloudflare nadzorna ploča ne dopušta ručno dodavanje tajni ovom
 * Workeru, a ključevi su već upisani kao build tajne. Vrijednosti se nikad
 * ne ispisuju u log; privremena datoteka briše se odmah nakon prijenosa.
 *
 * Pokreće se samo na Cloudflareu (WORKERS_CI ili CI). Ako ključeva nema ili
 * prijenos ne uspije, samo upozori: stranica se i dalje objavljuje.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const KEYS = ["KEYSTATIC_GITHUB_CLIENT_ID", "KEYSTATIC_GITHUB_CLIENT_SECRET", "KEYSTATIC_SECRET"];

if (!process.env.WORKERS_CI && !process.env.CI) {
  console.log("sync-secrets: preskačem (nije Cloudflare build).");
  process.exit(0);
}

const missing = KEYS.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`sync-secrets: nedostaju build varijable: ${missing.join(", ")}. Admin prijava neće raditi.`);
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "ks-"));
const file = join(dir, "secrets.json");
try {
  writeFileSync(file, JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))), { mode: 0o600 });
  execFileSync("npx", ["wrangler", "secret", "bulk", file], { stdio: ["ignore", "inherit", "inherit"] });
  console.log(`sync-secrets: preneseno ${KEYS.length} tajni u Worker.`);
} catch {
  console.warn("sync-secrets: prijenos tajni nije uspio. Stranica se objavljuje, ali admin prijava možda neće raditi.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
