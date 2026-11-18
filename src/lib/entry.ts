/**
 * Brzi unos: pretvara podatke iz obrasca u YAML datoteku istog oblika
 * kakav sprema Keystatic. Čiste funkcije, bez mreže, pa se mogu testirati.
 */
import { stringify } from "yaml";
import { ACTIVITIES } from "./model.ts";

const AMOUNT = /^\d+(\.\d{1,2})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const MAP: Record<string, string> = { č: "c", ć: "c", đ: "d", š: "s", ž: "z", Č: "c", Ć: "c", Đ: "d", Š: "s", Ž: "z" };

/** "Poslani upiti APPRR-u" → "poslani-upiti-apprr-u" (kao Keystatic). */
export function slugify(text: string): string {
  const s = text
    .replace(/[čćđšžČĆĐŠŽ]/g, (c) => MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return s || "unos";
}

/** "22,50" ili "22.5" → "22.50"; vraća null ako nije iznos. */
export function normalizeAmount(input: string): string | null {
  const v = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!AMOUNT.test(v)) return null;
  const [w = "0", f = ""] = v.split(".");
  return `${Number(w)}.${(f + "00").slice(0, 2)}`;
}

function validDate(v: string): boolean {
  if (!ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export interface Context {
  categories: Set<string>;
  phases: Set<string>;
}

export type Built = { ok: true; dir: string; slug: string; yaml: string; title: string } | { ok: false; error: string };

const get = (f: FormData | Map<string, string>, k: string) => String(f.get(k) ?? "").trim();

export function buildExpense(form: FormData | Map<string, string>, ctx: Context): Built {
  const description = get(form, "description");
  const date = get(form, "date");
  const category = get(form, "category");
  const phase = get(form, "phase");
  const supplier = get(form, "supplier");
  const amount = normalizeAmount(get(form, "amount"));
  const amountOnly = get(form, "amount_only") === "on";

  if (!description) return { ok: false, error: "Upiši opis troška." };
  if (description.length > 120) return { ok: false, error: "Opis je predug (najviše 120 znakova)." };
  if (!amount) return { ok: false, error: "Iznos nije ispravan. Upiši npr. 22,50." };
  if (!validDate(date)) return { ok: false, error: "Datum nije ispravan." };
  if (!ctx.categories.has(category)) return { ok: false, error: "Odaberi kategoriju." };
  if (!ctx.phases.has(phase)) return { ok: false, error: "Odaberi fazu." };

  const data: Record<string, unknown> = { description, date, category };
  if (supplier) data.supplier = supplier;
  data.amount_eur = amount;
  data.phase = phase;
  data.visibility = amountOnly ? "amount_only" : "public";

  return { ok: true, dir: "content/expenses", slug: slugify(description), yaml: stringify(data), title: description };
}

export function buildTimeline(form: FormData | Map<string, string>, ctx: Context): Built {
  const title = get(form, "title");
  const date = get(form, "date");
  const phase = get(form, "phase");
  const activity = get(form, "activity") || "none";
  const hoursRaw = get(form, "hours");
  const minutesRaw = get(form, "minutes");
  const isPublic = get(form, "private") !== "on";

  if (!title) return { ok: false, error: "Upiši što se dogodilo." };
  if (title.length > 120) return { ok: false, error: "Opis je predug (najviše 120 znakova)." };
  if (!validDate(date)) return { ok: false, error: "Datum nije ispravan." };
  if (!ctx.phases.has(phase)) return { ok: false, error: "Odaberi fazu." };
  if (activity !== "none" && !(activity in ACTIVITIES)) return { ok: false, error: "Odaberi aktivnost." };

  const h = hoursRaw === "" ? 0 : Number(hoursRaw);
  const m = minutesRaw === "" ? 0 : Number(minutesRaw);
  if (!Number.isInteger(h) || h < 0 || h > 24) return { ok: false, error: "Sati moraju biti cijeli broj od 0 do 24." };
  if (!Number.isInteger(m) || m < 0 || m > 59) return { ok: false, error: "Minute moraju biti cijeli broj od 0 do 59." };
  const total = h * 60 + m;
  if (total > 0 && activity === "none") return { ok: false, error: "Upisao si trajanje, pa odaberi i aktivnost." };

  const data: Record<string, unknown> = { title, date, phase, activity };
  if (total > 0) data.duration_minutes = total;
  data.public = isPublic;

  return { ok: true, dir: "content/timeline", slug: slugify(title), yaml: stringify(data), title };
}
