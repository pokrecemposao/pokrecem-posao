import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { buildExpense, buildTimeline, normalizeAmount, slugify } from "./entry.ts";

const ctx = { categories: new Set(["oprema", "alati-i-pretplate"]), phases: new Set(["priprema-i-suglasnosti"]) };
const f = (o: Record<string, string>) => new Map(Object.entries(o));

test("slug kao u Keystaticu, s hrvatskim slovima", () => {
  assert.equal(slugify("Poslani upiti APPRR-u i sanitarnoj inspekciji"), "poslani-upiti-apprr-u-i-sanitarnoj-inspekciji");
  assert.equal(slugify("Uređenje prostora: čišćenje i žbuka"), "uredenje-prostora-ciscenje-i-zbuka");
  assert.equal(slugify("Domena pokrecemposao.com"), "domena-pokrecemposao-com");
  assert.equal(slugify("!!!"), "unos");
  assert.ok(slugify("a ".repeat(80)).length <= 60);
});

test("iznos sa zarezom ili točkom", () => {
  assert.equal(normalizeAmount("22,50"), "22.50");
  assert.equal(normalizeAmount("22.5"), "22.50");
  assert.equal(normalizeAmount("11"), "11.00");
  assert.equal(normalizeAmount(" 1 234,00 "), "1234.00");
  assert.equal(normalizeAmount("22,505"), null);
  assert.equal(normalizeAmount("-5"), null);
  assert.equal(normalizeAmount("abc"), null);
});

test("trošak se sprema u obliku koji čita provjera i admin", () => {
  const r = buildExpense(f({ description: "LED rasvjeta, 8 kom", amount: "312,00", date: "2026-11-18", category: "oprema", phase: "priprema-i-suglasnosti", supplier: "Online trgovina" }), ctx);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.dir, "content/expenses");
  assert.equal(r.slug, "led-rasvjeta-8-kom");
  const data = parse(r.yaml);
  assert.deepEqual(data, {
    description: "LED rasvjeta, 8 kom",
    date: "2026-11-18",
    category: "oprema",
    supplier: "Online trgovina",
    amount_eur: "312.00",
    phase: "priprema-i-suglasnosti",
    visibility: "public",
  });
});

test("trošak: greške", () => {
  const base = { description: "X", amount: "10", date: "2026-11-18", category: "oprema", phase: "priprema-i-suglasnosti" };
  assert.equal(buildExpense(f({ ...base, description: "" }), ctx).ok, false);
  assert.equal(buildExpense(f({ ...base, amount: "10,123" }), ctx).ok, false);
  assert.equal(buildExpense(f({ ...base, date: "2026-02-30" }), ctx).ok, false);
  assert.equal(buildExpense(f({ ...base, category: "nema" }), ctx).ok, false);
  const r = buildExpense(f({ ...base, amount_only: "on" }), ctx);
  assert.ok(r.ok && parse(r.yaml).visibility === "amount_only");
});

test("vremenska crta: sati i minute u minute", () => {
  const r = buildTimeline(f({ title: "Bojanje zidova", date: "2026-12-04", phase: "priprema-i-suglasnosti", activity: "radovi", hours: "2", minutes: "30" }), ctx);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(parse(r.yaml), { title: "Bojanje zidova", date: "2026-12-04", phase: "priprema-i-suglasnosti", activity: "radovi", duration_minutes: 150, public: true });
});

test("vremenska crta: događaj bez trajanja i privatni redak", () => {
  const r = buildTimeline(f({ title: "Suglasnost dobivena", date: "2026-11-26", phase: "priprema-i-suglasnosti", activity: "none", private: "on" }), ctx);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(parse(r.yaml), { title: "Suglasnost dobivena", date: "2026-11-26", phase: "priprema-i-suglasnosti", activity: "none", public: false });
});

test("vremenska crta: trajanje bez aktivnosti i krive minute", () => {
  const base = { title: "X", date: "2026-11-18", phase: "priprema-i-suglasnosti" };
  assert.equal(buildTimeline(f({ ...base, activity: "none", minutes: "30" }), ctx).ok, false);
  assert.equal(buildTimeline(f({ ...base, activity: "radovi", minutes: "75" }), ctx).ok, false);
  assert.equal(buildTimeline(f({ ...base, activity: "radovi", hours: "1.5" }), ctx).ok, false);
});
