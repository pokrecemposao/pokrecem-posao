/**
 * Formatiranje i osnovni izračuni (specifikacija §8 i §10.4).
 * Novac je uvijek cijeli broj centi, vrijeme cijeli broj minuta.
 * Datumi su nizovi "YYYY-MM-DD" bez vremena, pa nema problema s vremenskim zonama.
 */

export const MONTHS_SHORT = [
  "sij", "velj", "ožu", "tra", "svi", "lip",
  "srp", "kol", "ruj", "lis", "stu", "pro",
] as const;

export const MONTHS_FULL = [
  "siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj",
  "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac",
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;

function parts(date: string): [number, number, number] {
  const m = ISO_DATE.exec(date);
  if (!m) throw new Error(`Neispravan datum: "${date}" (očekuje se YYYY-MM-DD)`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Redni broj dana od 1.1.1970. (UTC), za razlike između datuma. */
export function dayIndex(date: string): number {
  const [y, m, d] = parts(date);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** "Dan N" projekta: datum početka je Dan 1. */
export function dayNumber(date: string, startDate: string): number {
  return dayIndex(date) - dayIndex(startDate) + 1;
}

/** "Dan 27" ili "Dan 27–31". */
export function dayRange(from: string, to: string, startDate: string): string {
  const a = dayNumber(from, startDate);
  const b = dayNumber(to, startDate);
  if (b < a) throw new Error(`Kraj (${to}) je prije početka (${from})`);
  return a === b ? `Dan ${a}` : `Dan ${a}–${b}`;
}

/** "10. stu 2026." */
export function formatDate(date: string): string {
  const [y, m, d] = parts(date);
  return `${d}. ${MONTHS_SHORT[m - 1]} ${y}.`;
}

/** "186.50" → 18650. Odbija sve što nije točno zapisan iznos. */
export function parseCents(amount: string): number {
  if (!AMOUNT.test(amount)) throw new Error(`Neispravan iznos: "${amount}" (npr. 186.50)`);
  const [whole = "0", frac = ""] = amount.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 243600 → "2.436 €" (zaokruženo na euro), ili "2.436,00 €" s centima. */
export function formatEur(cents: number, withCents = false): string {
  if (!Number.isInteger(cents)) throw new Error(`Iznos mora biti cijeli broj centi: ${cents}`);
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  if (!withCents) return `${sign}${groupThousands(Math.round(abs / 100))} €`;
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}${groupThousands(euros)},${rest} €`;
}

/** 150 → "2,5 h"; 120 → "2 h". */
export function formatHours(minutes: number): string {
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace(".", ",")} h`;
}

/** "38 %" */
export function formatPercent(value: number): string {
  return `${value} %`;
}

/**
 * Postoci koji uvijek daju točno 100 (metoda najvećeg ostatka).
 * Ako je zbroj 0, vraća same nule.
 */
export function largestRemainder(values: readonly number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v * 100) / total);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ rest: r - Math.floor(r), i }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i)
    .forEach(({ i }) => {
      if (left > 0) {
        out[i] = (out[i] ?? 0) + 1;
        left--;
      }
    });
  return out;
}

/** Današnji datum u Zagrebu kao "YYYY-MM-DD". */
export function todayInZagreb(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
