/**
 * Pokreće se prije builda (npm run build). Učita sadržaj iz content/ i
 * zaustavi build ako podaci nisu ispravni.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildContent } from "../src/lib/content-files.ts";
import { validateContent } from "../src/lib/validate.ts";

const ROOT = process.cwd();

function walk(dir: string, out: Record<string, string>) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out[relative(ROOT, full).split("\\").join("/")] = readFileSync(full, "utf8");
  }
}

const files: Record<string, string> = {};
walk(join(ROOT, "content"), files);

const { content, parseErrors } = buildContent(files);
const errors = [...parseErrors, ...validateContent(content)];
const counts = `faze ${content.phases.length}, prekretnice ${content.milestones.length}, kategorije ${content.categories.length}, epizode ${content.episodes.length}, troškovi ${content.expenses.length}, vremenska crta ${content.timeline.length}`;

function plural(n: number): string {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return "greška";
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return "greške";
  return "grešaka";
}

if (errors.length) {
  console.error(`\n✗ Sadržaj nije ispravan (${errors.length} ${plural(errors.length)}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("\nIspravi u adminu (/keystatic) i spremi ponovno.\n");
  process.exit(1);
}
console.log(`✓ Sadržaj je ispravan (${counts}).`);
