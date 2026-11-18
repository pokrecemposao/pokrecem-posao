/**
 * Pokreće se prije builda (npm run build). Učita sadržaj iz content/ i
 * zaustavi build ako podaci nisu ispravni.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { parse } from "yaml";
import { type Content, type Entry, validateContent } from "../src/lib/validate.ts";

const ROOT = process.cwd();
const parseErrors: string[] = [];
const CONTENT = join(ROOT, "content");

function parseFile(file: string): Record<string, unknown> {
  try {
    return parseRaw(file);
  } catch (e) {
    parseErrors.push(`${relative(ROOT, file)}: datoteka se ne može pročitati (${(e as Error).message.split("\n")[0]})`);
    return {};
  }
}

function parseRaw(file: string): Record<string, unknown> {
  const raw = readFileSync(file, "utf8");
  if (file.endsWith(".mdoc") || file.endsWith(".md")) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    return m ? ((parse(m[1] ?? "") as Record<string, unknown>) ?? {}) : {};
  }
  return (parse(raw) as Record<string, unknown>) ?? {};
}

/** Podržava oba Keystatic oblika: "slug.yaml" i "slug/index.yaml" (te .mdoc). */
function loadCollection(dir: string): Entry[] {
  const path = join(CONTENT, dir);
  if (!existsSync(path)) return [];
  const out: Entry[] = [];
  for (const name of readdirSync(path).sort()) {
    const full = join(path, name);
    if (statSync(full).isDirectory()) {
      const inner = ["index.yaml", "index.mdoc", "index.md"].map((f) => join(full, f)).find(existsSync);
      if (inner) out.push({ slug: name, file: relative(ROOT, inner), data: parseFile(inner) });
    } else if (/\.(ya?ml|mdoc|md)$/.test(name)) {
      out.push({ slug: basename(name).replace(/\.(ya?ml|mdoc|md)$/, ""), file: relative(ROOT, full), data: parseFile(full) });
    }
  }
  return out;
}

function loadSingleton(dir: string): Entry | null {
  const candidates = [join(CONTENT, dir, "index.yaml"), join(CONTENT, `${dir}.yaml`)];
  const file = candidates.find(existsSync);
  return file ? { slug: dir, file: relative(ROOT, file), data: parseFile(file) } : null;
}

const content: Content = {
  settings: loadSingleton("settings"),
  phases: loadCollection("phases"),
  milestones: loadCollection("milestones"),
  categories: loadCollection("expense-categories"),
  episodes: loadCollection("episodes"),
  expenses: loadCollection("expenses"),
  timeline: loadCollection("timeline"),
};

const errors = [...parseErrors, ...validateContent(content)];
const counts = `faze ${content.phases.length}, prekretnice ${content.milestones.length}, kategorije ${content.categories.length}, epizode ${content.episodes.length}, troškovi ${content.expenses.length}, vremenska crta ${content.timeline.length}`;

function plural(n: number): string {
  const d = n % 10, h = n % 100;
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
