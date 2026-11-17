import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dayNumber,
  dayRange,
  formatDate,
  formatEur,
  formatHours,
  largestRemainder,
  parseCents,
  todayInZagreb,
} from "./format.ts";

const START = "2026-11-05";

test("dan početka je Dan 1", () => {
  assert.equal(dayNumber("2026-11-05", START), 1);
  assert.equal(dayNumber("2026-11-30", START), 26);
  assert.equal(dayNumber("2026-12-28", START), 54);
});

test("dani preko prijelaza na zimsko/ljetno vrijeme se ne pomiču", () => {
  assert.equal(dayNumber("2027-03-29", "2027-03-27"), 3);
  assert.equal(dayNumber("2027-10-31", "2027-10-30"), 2);
});

test("raspon dana", () => {
  assert.equal(dayRange("2026-12-01", "2026-12-05", START), "Dan 27–31");
  assert.equal(dayRange("2026-12-01", "2026-12-01", START), "Dan 27");
  assert.throws(() => dayRange("2026-12-05", "2026-12-01", START));
});

test("datum na hrvatskom", () => {
  assert.equal(formatDate("2026-11-10"), "10. stu 2026.");
  assert.equal(formatDate("2027-01-03"), "3. sij 2027.");
  assert.throws(() => formatDate("10.11.2026"));
});

test("iznosi se pretvaraju u cente bez decimalnih grešaka", () => {
  assert.equal(parseCents("186.50"), 18650);
  assert.equal(parseCents("0.1"), 10);
  assert.equal(parseCents("214.99"), 21499);
  assert.equal(parseCents("18"), 1800);
  assert.throws(() => parseCents("186,50"));
  assert.throws(() => parseCents("1.234"));
  assert.throws(() => parseCents("-5"));
});

test("zbroj centi je točan tamo gdje bi float pogriješio", () => {
  const sum = ["0.10", "0.20"].map(parseCents).reduce((a, b) => a + b, 0);
  assert.equal(sum, 30);
});

test("eur u hrvatskom formatu", () => {
  assert.equal(formatEur(243600), "2.436 €");
  assert.equal(formatEur(18650, true), "186,50 €");
  assert.equal(formatEur(123456789, true), "1.234.567,89 €");
  assert.equal(formatEur(5, true), "0,05 €");
  assert.throws(() => formatEur(1.5));
});

test("sati", () => {
  assert.equal(formatHours(120), "2 h");
  assert.equal(formatHours(150), "2,5 h");
});

test("postoci uvijek daju 100", () => {
  const p = largestRemainder([1, 1, 1]);
  assert.deepEqual(p, [34, 33, 33]);
  assert.equal(largestRemainder([60200, 7100, 50500, 15500, 5100]).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(largestRemainder([0, 0]), [0, 0]);
});

test("današnji datum u Zagrebu", () => {
  // 23:30 UTC 16.11. je već 17.11. u Zagrebu (UTC+1)
  assert.equal(todayInZagreb(new Date("2026-11-16T23:30:00Z")), "2026-11-17");
  // ljeto: UTC+2
  assert.equal(todayInZagreb(new Date("2027-07-01T22:30:00Z")), "2027-07-02");
});
