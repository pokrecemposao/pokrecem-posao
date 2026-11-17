# Pokrećem posao

Web stranica projekta "Pokrećem posao": od 12 m² do vlastitog posla uzgoja mikrozelenja.

Specifikacija: `docs/specifikacija.md`.

## Stanje

**Faza 0: postavljanje projekta.** Postoji raspored stranice (zaglavlje, podnožje, donja traka na mobitelu), dizajn tokeni, fontovi i rezervirana mjesta za sve javne stranice. Sadržaj, admin i izračuni dolaze u sljedećim fazama.

## Tehnologije

Astro (statički izlaz), TypeScript, Tailwind CSS 4, fontovi s vlastitog hostinga (Fontsource). Hosting: Cloudflare (Workers, statične datoteke).

## Objava na Cloudflareu

Projekt se objavljuje kao Cloudflare Worker sa statičnim datotekama (`wrangler.jsonc`). Svaki push na `main` pokreće build i objavu.

| Postavka | Vrijednost |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Domena | https://pokrecemposao.com |
| Rezervna adresa | https://pokrecem-posao.pokrecemposao.workers.dev |

## Naredbe

| Naredba | Što radi |
|---|---|
| `npm install` | Instalira pakete |
| `npm run dev` | Lokalni pregled na http://localhost:4321 |
| `npm run build` | Gradi stranicu u `dist/` |
| `npm run check` | Provjera tipova (Astro + TypeScript) |
| `npm test` | Jedinični testovi (Node 22.18+) |

## Struktura

```
src/
  components/   Logo, Icon, Header, TabBar, Footer, PageIntro
  config/       site.ts: privremene postavke (u fazi 1 prelaze u Keystatic)
  layouts/      BaseLayout: <head>, zaglavlje, podnožje, donja traka
  lib/          format.ts: datumi, dani projekta, euri, sati, postoci (+ testovi)
  pages/        /, /epizode/, /troskovi/, /napredak/, /o-meni/, /kontakt/, /privatnost/, 404
  styles/       global.css: Tailwind + dizajn tokeni
public/         favicon.svg, robots.txt
```

## Prije pokretanja stranice

Dok je stranica u izradi, `robots.txt` i `<meta name="robots">` zabranjuju indeksiranje. Pri pokretanju (faza 7) oboje treba ukloniti.
