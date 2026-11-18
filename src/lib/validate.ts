/**
 * Provjera sadržaja (specifikacija §8, zadnji odlomak).
 * Čista funkcija: prima već učitane podatke, vraća popis grešaka.
 * Build pada ako je popis neprazan.
 */

export interface Entry {
  /** Naziv datoteke bez nastavka, npr. "nabava-opreme". */
  slug: string;
  /** Putanja datoteke, za poruke o greškama. */
  file: string;
  data: Record<string, unknown>;
}

export interface Content {
  settings: Entry | null;
  phases: Entry[];
  milestones: Entry[];
  categories: Entry[];
  episodes: Entry[];
  expenses: Entry[];
  timeline: Entry[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;
const CURRENCY = /^[A-Z]{3}$/;
const ACTIVITIES = new Set(["none", "radovi", "proizvodnja", "administracija", "sadrzaj", "ostalo"]);

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isValidDate(v: string): boolean {
  if (!ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function validateContent(c: Content): string[] {
  const errors: string[] = [];
  const err = (e: Entry | null, msg: string) => errors.push(e ? `${e.file}: ${msg}` : msg);

  function date(e: Entry, key: string, required: boolean): string {
    const v = str(e.data[key]);
    if (!v) {
      if (required) err(e, `nedostaje datum "${key}"`);
      return "";
    }
    if (!isValidDate(v)) err(e, `neispravan datum "${key}": ${v}`);
    return v;
  }

  function ref(e: Entry, key: string, targets: Set<string>, what: string, required = true) {
    const v = str(e.data[key]);
    if (!v) {
      if (required) err(e, `nedostaje ${what}`);
      return;
    }
    if (!targets.has(v)) err(e, `${what} "${v}" ne postoji`);
  }

  // Postavke
  if (!c.settings) err(null, "nedostaju postavke (content/settings/index.yaml)");
  else date(c.settings, "project_start_date", true);

  // Faze
  const phaseSlugs = new Set(c.phases.map((p) => p.slug));
  const orders = new Map<number, string>();
  let openPhases = 0;
  for (const p of c.phases) {
    const order = p.data.order;
    if (typeof order !== "number" || !Number.isInteger(order) || order < 1) err(p, "redni broj mora biti cijeli broj ≥ 1");
    else if (orders.has(order)) err(p, `redni broj ${order} već ima faza "${orders.get(order)}"`);
    else orders.set(order, p.slug);

    const weight = p.data.weight;
    if (weight !== undefined && weight !== null && (typeof weight !== "number" || !Number.isInteger(weight) || weight < 1)) {
      err(p, "težina mora biti cijeli broj ≥ 1");
    }
    const pr = p.data.progress_at_last_episode;
    if (pr !== undefined && pr !== null && (typeof pr !== "number" || pr < 0 || pr > 100)) err(p, "napredak mora biti između 0 i 100");

    const start = date(p, "start_date", false);
    const end = date(p, "end_date", false);
    if (end && !start) err(p, "faza ima kraj, ali nema početak");
    if (start && end && end < start) err(p, `kraj (${end}) je prije početka (${start})`);
    if (start && !end) openPhases++;
  }
  if (openPhases > 1) err(null, `više od jedne faze je započeto, a nije završeno (${openPhases}); najviše jedna može biti u tijeku`);

  // Prekretnice
  for (const m of c.milestones) {
    date(m, "date", true);
    ref(m, "phase", phaseSlugs, "faza");
  }

  // Kategorije
  const catSlugs = new Set(c.categories.map((k) => k.slug));

  // Epizode
  const numbers = new Map<number, string>();
  for (const e of c.episodes) {
    const n = e.data.episode_number;
    if (n !== undefined && n !== null) {
      if (typeof n !== "number" || !Number.isInteger(n) || n < 1) err(e, "broj epizode mora biti cijeli broj ≥ 1");
      else if (numbers.has(n)) err(e, `epizoda ${n} već postoji ("${numbers.get(n)}")`);
      else numbers.set(n, e.slug);
    }
    const status = str(e.data.status) || "draft";
    if (status !== "draft" && status !== "published") err(e, `nepoznat status "${status}"`);
    const start = date(e, "event_start", true);
    const end = date(e, "event_end", true);
    date(e, "publish_date", true);
    if (start && end && end < start) err(e, `zadnji dan (${end}) je prije prvog (${start})`);
    if (status === "published" && !str(e.data.featured_image)) err(e, "objavljena epizoda mora imati naslovnu fotografiju");
    const platform = str(e.data.video_platform) || "none";
    if (platform !== "none" && !str(e.data.video_url)) err(e, "odabran je video, ali nema poveznice");
  }

  // Troškovi
  for (const x of c.expenses) {
    date(x, "date", true);
    ref(x, "category", catSlugs, "kategorija");
    ref(x, "phase", phaseSlugs, "faza");
    const amount = str(x.data.amount_eur);
    if (!AMOUNT.test(amount)) err(x, `neispravan iznos "${amount}" (npr. 186.50)`);
    const orig = str(x.data.original_amount);
    const cur = str(x.data.original_currency);
    if (orig && !AMOUNT.test(orig)) err(x, `neispravan izvorni iznos "${orig}"`);
    if (orig && !CURRENCY.test(cur)) err(x, "uz izvorni iznos treba valuta od tri slova, npr. USD");
    if (!orig && cur) err(x, "upisana je valuta, ali nema izvornog iznosa");
    const vis = str(x.data.visibility) || "public";
    if (vis !== "public" && vis !== "amount_only") err(x, `nepoznata vidljivost "${vis}"`);
  }

  // Vremenska crta
  for (const t of c.timeline) {
    date(t, "date", true);
    ref(t, "phase", phaseSlugs, "faza");
    const act = str(t.data.activity) || "none";
    if (!ACTIVITIES.has(act)) err(t, `nepoznata aktivnost "${act}"`);
    const d = t.data.duration_minutes;
    if (d !== undefined && d !== null) {
      if (typeof d !== "number" || !Number.isInteger(d) || d < 1) err(t, "trajanje mora biti cijeli broj minuta ≥ 1");
      else if (act === "none") err(t, "upisano je trajanje, ali nije odabrana aktivnost");
    }
  }

  return errors;
}
