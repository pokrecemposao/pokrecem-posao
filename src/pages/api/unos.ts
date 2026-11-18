/**
 * Prima obrasce s /unos i sprema novi trošak ili red vremenske crte kao commit
 * na GitHubu, u ime prijavljenog urednika. Zatim vraća na /unos s porukom.
 */
import type { APIRoute } from "astro";
import { loadModel } from "../../lib/bundled-content.ts";
import { buildExpense, buildTimeline } from "../../lib/entry.ts";
import { createYamlFile, hasRepoAccess, TOKEN_COOKIE } from "../../lib/github.ts";

export const prerender = false;

const back = (params: Record<string, string>) =>
  new Response(null, { status: 303, headers: { Location: `/unos?${new URLSearchParams(params).toString()}`, "Cache-Control": "no-store" } });

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return new Response("Zabranjeno", { status: 403 });

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const obrazac = kind === "crta" ? "crta" : "trosak";

  const token = cookies.get(TOKEN_COOKIE)?.value;
  if (!token || !(await hasRepoAccess(token))) {
    return back({ obrazac, greska: "Prijava je istekla ili nisi prijavljen. Otvori admin, pa se vrati ovamo." });
  }

  const model = loadModel();
  const ctx = { categories: new Set(model.categories.map((c) => c.slug)), phases: new Set(model.phases.map((p) => p.slug)) };
  const built = kind === "trosak" ? buildExpense(form, ctx) : kind === "crta" ? buildTimeline(form, ctx) : { ok: false as const, error: "Nepoznat obrazac." };
  if (!built.ok) return back({ obrazac, greska: built.error });

  const label = kind === "trosak" ? "trošak" : "vremenska crta";
  const saved = await createYamlFile(token, built.dir, built.slug, built.yaml, `Brzi unos (${label}): ${built.title}`);
  if (!saved.ok) return back({ obrazac, greska: saved.error });

  return back({ obrazac, spremljeno: built.title });
};
