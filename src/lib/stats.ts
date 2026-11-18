/**
 * Pravila objave (§6) i izračuni (§8).
 * Javna stranica koristi granični datum iz objavljenih epizoda;
 * privatni pregled koristi današnji datum i uključuje privatne retke.
 */
import { dayIndex, dayNumber, largestRemainder, MONTHS_SHORT } from "./format.ts";
import { ACTIVITIES, type Activity, type Episode, type Model, type Phase } from "./model.ts";

export type PhaseStatus = "done" | "in_progress" | "planned";

export interface Publication {
  published: Episode[];
  /** Zadnji dan koji pokriva objavljena epizoda; null ako ništa nije objavljeno. */
  cutoff: string | null;
  /** Najnovija numerirana epizoda (za "u zadnjoj epizodi"). */
  latestNumbered: Episode | null;
  scheduled: Episode[];
}

export function publication(m: Model, today: string): Publication {
  const isPub = (e: Episode) => e.status === "published";
  const published = m.episodes
    .filter((e) => isPub(e) && e.publishDate <= today)
    .sort((a, b) => b.eventEnd.localeCompare(a.eventEnd));
  return {
    published,
    cutoff: published[0]?.eventEnd ?? null,
    latestNumbered: published.find((e) => e.number !== null) ?? null,
    scheduled: m.episodes.filter((e) => isPub(e) && e.publishDate > today),
  };
}

export function phaseStatus(p: Phase, cutoff: string): PhaseStatus {
  if (p.end && p.end <= cutoff) return "done";
  if (p.start && p.start <= cutoff) return "in_progress";
  return "planned";
}

export interface Stats {
  cutoff: string;
  day: number;
  totalCents: number;
  expenseCount: number;
  totalMinutes: number;
  byCategory: { slug: string; name: string; color: string; cents: number; pct: number }[];
  byMonth: { key: string; label: string; cents: number }[];
  byActivity: { key: Activity; label: string; minutes: number }[];
  phases: (Phase & { status: PhaseStatus; cents: number; minutes: number; days: number | null })[];
  current: Phase | null;
  progress: number;
}

export interface StatsOptions {
  /** Uključi retke vremenske crte označene kao privatni (samo za privatni pregled). */
  includePrivate?: boolean;
}

export function computeStats(m: Model, cutoff: string, opts: StatsOptions = {}): Stats {
  const expenses = m.expenses.filter((e) => e.date <= cutoff);
  const timeline = m.timeline.filter((t) => t.date <= cutoff && (t.public || opts.includePrivate));

  const totalCents = expenses.reduce((a, e) => a + e.cents, 0);
  const totalMinutes = timeline.reduce((a, t) => a + (t.minutes ?? 0), 0);

  const catCents = m.categories.map((c) => expenses.filter((e) => e.category === c.slug).reduce((a, e) => a + e.cents, 0));
  const pcts = largestRemainder(catCents);
  const byCategory = m.categories.map((c, i) => ({ slug: c.slug, name: c.name, color: c.color, cents: catCents[i] ?? 0, pct: pcts[i] ?? 0 }));

  const byMonth: Stats["byMonth"] = [];
  if (m.startDate && cutoff >= m.startDate) {
    let [y, mo] = m.startDate.split("-").map(Number) as [number, number];
    const [ty, tm] = cutoff.split("-").map(Number) as [number, number];
    while (y < ty || (y === ty && mo <= tm)) {
      const key = `${y}-${String(mo).padStart(2, "0")}`;
      byMonth.push({ key, label: MONTHS_SHORT[mo - 1] ?? key, cents: expenses.filter((e) => e.date.startsWith(key)).reduce((a, e) => a + e.cents, 0) });
      mo++;
      if (mo > 12) {
        mo = 1;
        y++;
      }
    }
  }

  const byActivity = (Object.keys(ACTIVITIES) as Activity[]).map((key) => ({
    key,
    label: ACTIVITIES[key],
    minutes: timeline.filter((t) => t.activity === key).reduce((a, t) => a + (t.minutes ?? 0), 0),
  }));

  const phases = m.phases.map((p) => {
    const status = phaseStatus(p, cutoff);
    const days =
      status === "done" && p.start && p.end
        ? dayIndex(p.end) - dayIndex(p.start) + 1
        : status === "in_progress" && p.start
          ? dayIndex(cutoff) - dayIndex(p.start) + 1
          : null;
    return {
      ...p,
      status,
      cents: expenses.filter((e) => e.phase === p.slug).reduce((a, e) => a + e.cents, 0),
      minutes: timeline.filter((t) => t.phase === p.slug).reduce((a, t) => a + (t.minutes ?? 0), 0),
      days,
    };
  });

  const sumW = phases.reduce((a, p) => a + p.weight, 0);
  const done = phases.reduce((a, p) => a + p.weight * (p.status === "done" ? 1 : p.status === "in_progress" ? p.progress / 100 : 0), 0);
  const progress = sumW ? Math.round((done / sumW) * 100) : 0;
  const current = phases.find((p) => p.status === "in_progress") ?? phases.find((p) => p.status === "planned") ?? null;

  return {
    cutoff,
    day: m.startDate ? dayNumber(cutoff, m.startDate) : 0,
    totalCents,
    expenseCount: expenses.length,
    totalMinutes,
    byCategory,
    byMonth,
    byActivity,
    phases,
    current,
    progress,
  };
}
