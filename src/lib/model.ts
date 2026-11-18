/**
 * Tipizirani model sadržaja (specifikacija §7), izveden iz provjerenih datoteka.
 * Novac u centima, trajanje u minutama, datumi kao "YYYY-MM-DD".
 */
import { parseCents } from "./format.ts";
import type { Content, Entry } from "./validate.ts";

export const ACTIVITIES = {
  radovi: "Radovi i uređenje",
  proizvodnja: "Priprema proizvodnje",
  administracija: "Administracija",
  sadrzaj: "Snimanje i sadržaj",
  ostalo: "Ostalo",
} as const;
export type Activity = keyof typeof ACTIVITIES;

export interface Phase {
  slug: string;
  title: string;
  order: number;
  weight: number;
  start: string | null;
  end: string | null;
  progress: number;
  description: string;
}
export interface Category {
  slug: string;
  name: string;
  order: number;
  color: string;
}
export interface Episode {
  slug: string;
  title: string;
  number: number | null;
  status: "draft" | "published";
  eventStart: string;
  eventEnd: string;
  publishDate: string;
}
export interface Expense {
  slug: string;
  description: string;
  date: string;
  category: string;
  supplier: string;
  cents: number;
  original: { cents: number; currency: string } | null;
  phase: string;
  visibility: "public" | "amount_only";
}
export interface TimelineEntry {
  slug: string;
  title: string;
  date: string;
  phase: string;
  activity: Activity | null;
  minutes: number | null;
  public: boolean;
}
export interface Milestone {
  slug: string;
  title: string;
  date: string;
  phase: string;
}
export interface Model {
  startDate: string;
  phases: Phase[];
  categories: Category[];
  episodes: Episode[];
  expenses: Expense[];
  timeline: TimelineEntry[];
  milestones: Milestone[];
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const n = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const nOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

/** Pretpostavlja da je sadržaj već prošao validateContent(). */
export function toModel(c: Content): Model {
  const d = (e: Entry) => e.data;
  return {
    startDate: s(c.settings?.data.project_start_date),
    phases: c.phases
      .map((e) => ({
        slug: e.slug,
        title: s(d(e).title) || e.slug,
        order: n(d(e).order, 0),
        weight: n(d(e).weight, 1),
        start: s(d(e).start_date) || null,
        end: s(d(e).end_date) || null,
        progress: n(d(e).progress_at_last_episode, 0),
        description: s(d(e).description),
      }))
      .sort((a, b) => a.order - b.order),
    categories: c.categories
      .map((e) => ({ slug: e.slug, name: s(d(e).name) || e.slug, order: n(d(e).order, 0), color: s(d(e).color) || "chart-5" }))
      .sort((a, b) => a.order - b.order),
    episodes: c.episodes.map((e) => ({
      slug: e.slug,
      title: s(d(e).title) || e.slug,
      number: nOrNull(d(e).episode_number),
      status: s(d(e).status) === "published" ? "published" : "draft",
      eventStart: s(d(e).event_start),
      eventEnd: s(d(e).event_end),
      publishDate: s(d(e).publish_date),
    })),
    expenses: c.expenses
      .map((e) => {
        const orig = s(d(e).original_amount);
        return {
          slug: e.slug,
          description: s(d(e).description) || e.slug,
          date: s(d(e).date),
          category: s(d(e).category),
          supplier: s(d(e).supplier),
          cents: parseCents(s(d(e).amount_eur)),
          original: orig ? { cents: parseCents(orig), currency: s(d(e).original_currency) } : null,
          phase: s(d(e).phase),
          visibility: s(d(e).visibility) === "amount_only" ? "amount_only" : "public",
        } satisfies Expense;
      })
      .sort(byDate),
    timeline: c.timeline
      .map((e) => {
        const act = s(d(e).activity);
        return {
          slug: e.slug,
          title: s(d(e).title) || e.slug,
          date: s(d(e).date),
          phase: s(d(e).phase),
          activity: act in ACTIVITIES ? (act as Activity) : null,
          minutes: nOrNull(d(e).duration_minutes),
          public: d(e).public !== false,
        } satisfies TimelineEntry;
      })
      .sort(byDate),
    milestones: c.milestones
      .map((e) => ({ slug: e.slug, title: s(d(e).title) || e.slug, date: s(d(e).date), phase: s(d(e).phase) }))
      .sort(byDate),
  };
}
