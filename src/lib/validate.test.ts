import { test } from "node:test";
import assert from "node:assert/strict";
import { type Content, type Entry, validateContent } from "./validate.ts";

const e = (slug: string, data: Record<string, unknown>, dir = "x"): Entry => ({ slug, file: `content/${dir}/${slug}.yaml`, data });

function base(): Content {
  return {
    settings: e("settings", { project_start_date: "2026-11-05" }, "settings"),
    phases: [
      e("priprema", { order: 1, weight: 1, start_date: "2026-11-05" }, "phases"),
      e("uredenje", { order: 2, weight: 2 }, "phases"),
    ],
    milestones: [e("m1", { date: "2026-11-05", phase: "priprema" }, "milestones")],
    categories: [e("oprema", { order: 1, color: "chart-1" }, "expense-categories")],
    episodes: [],
    expenses: [],
    timeline: [e("t1", { date: "2026-11-05", phase: "priprema", activity: "administracija", duration_minutes: 60, public: true }, "timeline")],
  };
}

test("ispravan sadržaj nema grešaka", () => {
  assert.deepEqual(validateContent(base()), []);
});

test("nedostaju postavke", () => {
  const c = base();
  c.settings = null;
  assert.equal(validateContent(c).length, 1);
});

test("dvije epizode s istim brojem", () => {
  const c = base();
  const ep = { status: "draft", event_start: "2026-12-01", event_end: "2026-12-05", publish_date: "2026-12-10" };
  c.episodes = [e("a", { ...ep, episode_number: 3 }), e("b", { ...ep, episode_number: 3 })];
  const errs = validateContent(c);
  assert.equal(errs.length, 1);
  assert.match(errs[0] ?? "", /epizoda 3 već postoji/);
});

test("epizoda: kraj prije početka, objavljena bez slike, video bez poveznice", () => {
  const c = base();
  c.episodes = [
    e("a", { status: "published", event_start: "2026-12-05", event_end: "2026-12-01", publish_date: "2026-12-10", video_platform: "youtube" }),
  ];
  const errs = validateContent(c).join("\n");
  assert.match(errs, /prije prvog/);
  assert.match(errs, /naslovnu fotografiju/);
  assert.match(errs, /nema poveznice/);
});

test("epizoda bez broja (UVOD) je u redu", () => {
  const c = base();
  c.episodes = [e("uvod", { status: "draft", event_start: "2026-11-05", event_end: "2026-11-30", publish_date: "2026-12-10" })];
  assert.deepEqual(validateContent(c), []);
});

test("troškovi: iznos, valuta, nepostojeća kategorija i faza", () => {
  const c = base();
  c.expenses = [
    e("a", { date: "2026-12-01", category: "oprema", phase: "priprema", amount_eur: "186,50" }),
    e("b", { date: "2026-12-01", category: "nema", phase: "nema", amount_eur: "10.00" }),
    e("c", { date: "2026-12-01", category: "oprema", phase: "priprema", amount_eur: "49.80", original_amount: "58.00" }),
    e("d", { date: "2026-12-01", category: "oprema", phase: "priprema", amount_eur: "49.80", original_amount: "58.00", original_currency: "USD" }),
  ];
  const errs = validateContent(c).join("\n");
  assert.match(errs, /a\.yaml: neispravan iznos "186,50"/);
  assert.match(errs, /kategorija "nema" ne postoji/);
  assert.match(errs, /faza "nema" ne postoji/);
  assert.match(errs, /c\.yaml: uz izvorni iznos treba valuta/);
  assert.doesNotMatch(errs, /d\.yaml/);
});

test("vremenska crta: trajanje bez aktivnosti i događaj bez trajanja", () => {
  const c = base();
  c.timeline.push(e("t2", { date: "2026-11-06", phase: "priprema", activity: "none", duration_minutes: 30 }));
  c.timeline.push(e("t3", { date: "2026-11-16", phase: "priprema", activity: "none" }));
  const errs = validateContent(c);
  assert.equal(errs.length, 1);
  assert.match(errs[0] ?? "", /t2\.yaml: .*nije odabrana aktivnost/);
});

test("faze: dvostruki redni broj, dvije u tijeku, kraj bez početka, kraj prije početka", () => {
  const c = base();
  c.phases.push(e("a", { order: 1, start_date: "2026-12-01" }));
  c.phases.push(e("b", { order: 3, end_date: "2026-12-01" }));
  c.phases.push(e("c", { order: 4, start_date: "2026-12-10", end_date: "2026-12-01" }));
  const errs = validateContent(c).join("\n");
  assert.match(errs, /redni broj 1 već ima/);
  assert.match(errs, /više od jedne faze/);
  assert.match(errs, /kraj, ali nema početak/);
  assert.match(errs, /kraj \(2026-12-01\) je prije početka/);
});

test("neispravni datumi se odbijaju", () => {
  const c = base();
  c.milestones.push(e("m2", { date: "2026-02-30", phase: "priprema" }));
  c.milestones.push(e("m3", { date: "5.11.2026", phase: "priprema" }));
  assert.equal(validateContent(c).length, 2);
});
