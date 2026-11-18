/**
 * Pretvara sirove datoteke iz content/ u strukturu za provjeru i izračune.
 * Koriste ga i skripta za provjeru (čita s diska) i privatni pregled (datoteke
 * ugrađene u build), pa oboje vide isti sadržaj na isti način.
 *
 * Ključevi su putanje oblika "content/phases/nabava-opreme.yaml"
 * (dopušten je i početni "/"). Podržani su Keystatic oblici
 * "slug.yaml", "slug/index.yaml" i .mdoc s YAML zaglavljem.
 */
import { parse } from "yaml";
import type { Content, Entry } from "./validate.ts";

const DIRS = {
  phases: "phases",
  milestones: "milestones",
  categories: "expense-categories",
  episodes: "episodes",
  expenses: "expenses",
  timeline: "timeline",
} as const;

function parseRaw(path: string, raw: string): Record<string, unknown> {
  if (/\.(mdoc|md)$/.test(path)) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
    return m ? ((parse(m[1] ?? "") as Record<string, unknown> | null) ?? {}) : {};
  }
  return (parse(raw) as Record<string, unknown> | null) ?? {};
}

export function buildContent(files: Record<string, string>): { content: Content; parseErrors: string[] } {
  const parseErrors: string[] = [];
  const entries: Record<keyof typeof DIRS, Entry[]> = { phases: [], milestones: [], categories: [], episodes: [], expenses: [], timeline: [] };
  let settings: Entry | null = null;

  for (const key of Object.keys(files).sort()) {
    const path = key.replace(/^\/+/, "");
    const m = /^content\/([^/]+)\/(.+)$/.exec(path);
    if (!m) continue;
    const [, dir, rest = ""] = m;
    if (!/\.(ya?ml|mdoc|md)$/.test(rest)) continue;

    let data: Record<string, unknown>;
    try {
      data = parseRaw(path, files[key] ?? "");
    } catch (e) {
      parseErrors.push(`${path}: datoteka se ne može pročitati (${String((e as Error).message).split("\n")[0]})`);
      data = {};
    }

    if (dir === "settings") {
      if (rest === "index.yaml") settings = { slug: "settings", file: path, data };
      continue;
    }
    const kind = (Object.keys(DIRS) as (keyof typeof DIRS)[]).find((k) => DIRS[k] === dir);
    if (!kind) continue;

    // "slug.yaml" ili "slug/index.yaml"; ostale datoteke u mapi unosa (npr. content.mdoc) se preskaču
    const flat = /^([^/]+)\.(ya?ml|mdoc|md)$/.exec(rest);
    const nested = /^([^/]+)\/index\.(ya?ml|mdoc|md)$/.exec(rest);
    const slug = flat?.[1] ?? nested?.[1];
    if (slug) entries[kind].push({ slug, file: path, data });
  }

  return { content: { settings, ...entries }, parseErrors };
}
