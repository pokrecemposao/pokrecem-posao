import { test } from "node:test";
import assert from "node:assert/strict";
import type { Model } from "./model.ts";
import { computeStats, phaseStatus, publication } from "./stats.ts";

function model(): Model {
  return {
    startDate: "2026-11-05",
    phases: [
      { slug: "p1", title: "Priprema", order: 1, weight: 1, start: "2026-11-05", end: "2026-11-30", progress: 0, description: "" },
      { slug: "p2", title: "Uređenje", order: 2, weight: 2, start: "2026-12-01", end: "2026-12-22", progress: 0, description: "" },
      { slug: "p3", title: "Oprema", order: 3, weight: 2, start: "2026-12-23", end: null, progress: 40, description: "" },
      { slug: "p4", title: "Uzgoj", order: 4, weight: 1, start: null, end: null, progress: 0, description: "" },
    ],
    categories: [
      { slug: "oprema", name: "Oprema", order: 1, color: "chart-1" },
      { slug: "ostalo", name: "Ostalo", order: 2, color: "chart-5" },
    ],
    episodes: [
      { slug: "uvod", title: "Uvod", number: null, status: "published", eventStart: "2026-11-05", eventEnd: "2026-11-30", publishDate: "2026-12-10" },
      { slug: "ep1", title: "EP1", number: 1, status: "published", eventStart: "2026-12-01", eventEnd: "2026-12-05", publishDate: "2026-12-12" },
      { slug: "ep2", title: "EP2", number: 2, status: "published", eventStart: "2026-12-06", eventEnd: "2026-12-11", publishDate: "2027-01-20" },
      { slug: "ep3", title: "EP3", number: 3, status: "draft", eventStart: "2026-12-12", eventEnd: "2026-12-20", publishDate: "2026-12-15" },
    ],
    expenses: [
      { slug: "a", description: "Domena", date: "2026-11-09", category: "ostalo", supplier: "", cents: 1800, original: null, phase: "p1", visibility: "public" },
      { slug: "b", description: "Boja", date: "2026-12-04", category: "oprema", supplier: "", cents: 8990, original: null, phase: "p2", visibility: "public" },
      { slug: "c", description: "Kasnije", date: "2026-12-20", category: "oprema", supplier: "", cents: 50000, original: null, phase: "p2", visibility: "public" },
    ],
    timeline: [
      { slug: "t1", title: "Razgovor", date: "2026-11-05", phase: "p1", activity: "administracija", minutes: 60, public: true },
      { slug: "t2", title: "Tajno", date: "2026-11-06", phase: "p1", activity: "ostalo", minutes: 30, public: false },
      { slug: "t3", title: "Bojanje", date: "2026-12-04", phase: "p2", activity: "radovi", minutes: 360, public: true },
      { slug: "t4", title: "Bez sati", date: "2026-11-16", phase: "p1", activity: null, minutes: null, public: true },
    ],
    milestones: [],
  };
}

test("objavljene epizode i granični datum", () => {
  const p = publication(model(), "2026-12-20");
  assert.deepEqual(p.published.map((e) => e.slug), ["ep1", "uvod"]);
  assert.equal(p.cutoff, "2026-12-05");
  assert.equal(p.latestNumbered?.slug, "ep1");
  assert.deepEqual(p.scheduled.map((e) => e.slug), ["ep2"]);
});

test("skica se ne objavljuje ni kad joj prođe datum", () => {
  const p = publication(model(), "2027-02-01");
  assert.ok(!p.published.some((e) => e.slug === "ep3"));
  assert.equal(p.cutoff, "2026-12-11");
});

test("bez objavljenih epizoda nema graničnog datuma", () => {
  assert.equal(publication(model(), "2026-11-20").cutoff, null);
});

test("status faze ovisi o graničnom datumu", () => {
  const [p1, p2, p3] = model().phases;
  assert.equal(phaseStatus(p1!, "2026-12-05"), "done");
  assert.equal(phaseStatus(p2!, "2026-12-05"), "in_progress");
  assert.equal(phaseStatus(p3!, "2026-12-05"), "planned");
});

test("javni izračun ne vidi ništa nakon graničnog datuma ni privatne retke", () => {
  const s = computeStats(model(), "2026-12-05");
  assert.equal(s.totalCents, 1800 + 8990);
  assert.equal(s.expenseCount, 2);
  assert.equal(s.totalMinutes, 60 + 360);
  assert.equal(s.day, 31);
  assert.deepEqual(s.byMonth.map((x) => [x.key, x.cents]), [["2026-11", 1800], ["2026-12", 8990]]);
  assert.equal(s.byCategory.reduce((a, c) => a + c.pct, 0), 100);
  assert.equal(s.current?.slug, "p2");
});

test("privatni pregled uključuje privatne retke", () => {
  const s = computeStats(model(), "2026-12-05", { includePrivate: true });
  assert.equal(s.totalMinutes, 60 + 30 + 360);
});

test("napredak: težine faza i postotak faze u tijeku", () => {
  // p1 i p2 gotove (1 + 2), p3 u tijeku 40 % (2 × 0,4), ukupna težina 6 → 3,8 / 6 = 63 %
  const s = computeStats(model(), "2026-12-23");
  assert.equal(s.progress, 63);
  const p3 = s.phases.find((p) => p.slug === "p3");
  assert.equal(p3?.status, "in_progress");
  assert.equal(p3?.days, 1);
  const p1 = s.phases.find((p) => p.slug === "p1");
  assert.equal(p1?.days, 26);
});

test("prazno stanje ne ruši izračun", () => {
  const m = model();
  m.expenses = [];
  m.timeline = [];
  const s = computeStats(m, "2026-11-05");
  assert.equal(s.totalCents, 0);
  assert.ok(s.byCategory.every((c) => c.pct === 0));
});
