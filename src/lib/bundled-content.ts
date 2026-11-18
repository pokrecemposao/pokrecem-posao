/**
 * Sadržaj ugrađen u poslužiteljski dio pri buildu (za privatni pregled i brzi unos).
 * Osvježava se sa svakom objavom, otprilike minutu nakon spremanja.
 * Ne uvoziti u javne stranice koje se šalju pregledniku.
 */
import { buildContent } from "./content-files.ts";
import { toModel, type Model } from "./model.ts";

const RAW = import.meta.glob("/content/**/*.{yaml,yml,mdoc}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function loadModel(): Model {
  return toModel(buildContent(RAW).content);
}
