# POKREĆEM POSAO
## Tehnička arhitektura i specifikacija razvoja — v2.1 (temeljeno na datotekama, društvene mreže na prvom mjestu)

> Promjene u v2.1: projekt počinje 2026-11-05; zapisi na stranici su **epizode** koje prate numerirane epizode na društvenim mrežama; sve javne brojke ograničene su na zadnji dan koji pokriva objavljena epizoda; praćenje vremena zamijenjeno je **vremenskom crtom** koja odgovara vlasnikovoj evidenciji u Google Sheetsu; status faze izračunava se iz datuma; newsletter je izbačen iz v1.
>
> Nazivi polja, kolekcija i tehnički pojmovi ostavljeni su na engleskom jer se tako pišu u kodu.

---

### 1. Pregled projekta

"Pokrećem posao" dokumentira stvarni proces pokretanja malog posla uzgoja mikrozelenja, od prvog razgovora o njemu do prvih kupaca. Obećanje brenda je **"bez uljepšavanja"**: svaka javna brojka izračunata je iz zabilježenih podataka.

**Društvene mreže su glavni kanal.** Numerirane epizode objavljuju se na Instagramu, TikToku, YouTubeu i Facebooku. Web stranica je arhiva i "račun" iza tih epizoda: točni troškovi, sati, vremenska crta po danima i ukupni napredak.

Sadržaj se snima unaprijed i objavljuje s odmakom. Stranica nikad ne smije otkriti ništa što još nije objavljeno kao epizoda.

Jedan administrator. Više urednika može se kasnije dodati kao suradnici na GitHubu.

---

### 2. Načelo arhitekture

1. Sav sadržaj su datoteke (YAML / Markdoc) u **privatnom GitHub repozitoriju**.
2. Administrator uređuje sadržaj kroz **Keystatic** na `/keystatic`. Svako spremanje je Git commit. Vremenska crta i troškovi mogu se umjesto toga uvesti iz CSV izvoza vlasnikovog Google Sheetsa (§12).
3. Svaki commit na `main` pokreće ponovnu izgradnju stranice; zakazana dnevna izgradnja objavljuje epizode kojima je stigao datum objave.
4. Svi zbrojevi, grafikoni, statusi faza i napredak izračunavaju se tijekom izgradnje (builda).
5. Povjerljivi dokumenti (računi, ugovori, suglasnost poslodavca) **nikad** se ne spremaju u repozitorij. Trošak sadrži samo privatnu tekstualnu oznaku svog računa.

---

### 3. Tehnologije

| Namjena | Izbor |
|---|---|
| Okvir | Astro (statički izlaz; dinamičke rute samo gdje ih Keystatic traži) |
| Jezik | TypeScript (strict) |
| Stilovi | Tailwind CSS |
| Uređivanje sadržaja | Keystatic, način spremanja na GitHub |
| Formatirani tekst | Markdoc (kroz Keystatic) |
| Grafikoni | SVG generiran tijekom builda, bez biblioteke za grafikone u pregledniku |
| Video | Ugradnja koja se učitava tek na klik (YouTube u načinu pojačane privatnosti, Instagram); nijedan zahtjev prema trećoj strani prije klika |
| Hosting | Cloudflare Pages (alternativa: Netlify) |
| Izvorni kod | GitHub, privatni repozitorij |
| Kontakt obrazac | Vanjski servis za obrasce (ili Netlify Forms ako se odabere Netlify) |
| Analitika (opcionalno) | Analitika bez kolačića (npr. Cloudflare Web Analytics) |

Tijekom postavljanja projekta provjeriti radi li Keystatic u GitHub načinu s Astro adapterom odabranog hostinga. Ako ne radi, mijenja se hosting, a ne arhitektura.

---

### 4. Javne rute

- `/` — početna
- `/epizode` — popis epizoda
- `/epizode/[slug]` — pojedinačna epizoda
- `/troskovi` — troškovi
- `/napredak` — napredak, faze, prekretnice, vremenska crta
- `/o-meni` — o meni
- `/kontakt` — kontakt
- `/privatnost` — pravila privatnosti

### 5. Administracija

- `/keystatic`, zaštićen prijavom preko GitHuba, kroz GitHub App ograničen na ovaj repozitorij.
- Dvofaktorska autentifikacija na GitHubu je **obavezna** za administratorski račun.
- Nema javne registracije.

---

### 6. Pravila objave (srž sustava)

Ova pravila primjenjuju se ovim redom pri svakoj izgradnji. "Danas" je datum izgradnje u vremenskoj zoni Europe/Zagreb.

1. **Objavljene epizode** = epizode sa `status: published` i `publish_date ≤ danas`.
2. **Granični datum** = najkasniji `event_end` među objavljenim epizodama. Ako nijedna nije objavljena, prikazuju se samo statične stranice.
3. Troškovi, unosi vremenske crte i prekretnice javni su samo ako im je datum **≤ graničnog datuma** (unosi vremenske crte moraju imati i `public: true`).
4. Status faze **izračunava se** u odnosu na granični datum (§7.2), pa ne može otići ispred priče.
5. Svaka stranica s brojkama prikazuje napomenu: *"Brojke prikazuju stanje do Dana N (datum), koliko pokrivaju objavljene epizode."*
6. Skice i zakazane epizode ne smiju se pojaviti nigdje: na stranicama, u popisima, sitemapu, RSS-u, pretrazi, zbrojevima ni u izlazu builda. Test to mora provjeravati.

---

### 7. Model sadržaja

Ovo je potpun popis kolekcija i polja. **Nijedno polje ne smije se dodati bez prethodne izmjene ovog odjeljka.** Vrijednosti označene kao *izračunato* nikad se ne spremaju.

#### 7.1 `settings` (jedinstveni zapis)
| Polje | Tip | Napomena |
|---|---|---|
| site_title | tekst | "POKREĆEM POSAO" |
| tagline | tekst | "Od 12 m² do vlastitog posla" |
| project_start_date | datum | **2026-11-05** = Dan 1 |
| hero_eyebrow | tekst | |
| hero_title | tekst | |
| hero_text | tekst (više redaka) | |
| hero_image | slika + alternativni tekst | |
| about_content | Markdoc | `/o-meni` |
| contact_email | tekst | |
| social_links | niz { platform: izbor (instagram, youtube, tiktok, facebook), handle: tekst, url: URL } | |

#### 7.2 `phases` (faze)
| Polje | Tip | Napomena |
|---|---|---|
| title | tekst | |
| slug | slug | |
| order | cijeli broj ≥ 1, jedinstven | |
| weight | cijeli broj ≥ 1, zadano 1 | Relativna veličina faze |
| start_date | datum | Neobavezno dok faza ne počne |
| end_date | datum | Neobavezno dok faza ne završi |
| progress_at_last_episode | cijeli broj 0–100 | Vlasnik upisuje stanje prikazano u zadnjoj objavljenoj epizodi |
| description | tekst | |
| status | *izračunato* | `done` ako je end_date ≤ graničnog datuma; `in_progress` ako je start_date ≤ graničnog datuma; inače `planned`. Build pada ako je više od jedne faze `in_progress`. |

Početne faze: 1 Priprema i suglasnosti (od 2026-11-05), 2 Uređenje prostora, 3 Nabava opreme, 4 Priprema proizvodnje, 5 Prvi uzgoj, 6 Prvi kupci.

#### 7.3 `milestones` (prekretnice)
| Polje | Tip | Napomena |
|---|---|---|
| title | tekst | |
| date | datum | |
| phase | veza → phases | |

#### 7.4 `expense_categories` (kategorije troškova)
| Polje | Tip | Napomena |
|---|---|---|
| name | tekst | |
| slug | slug | |
| order | cijeli broj | |
| color | izbor iz boja grafikona brenda | §10.2 |

#### 7.5 `episodes` (epizode)
| Polje | Tip | Napomena |
|---|---|---|
| title | tekst | |
| slug | slug | Hrvatski dijakritici se pretvaraju (č→c, đ→d…) |
| episode_number | cijeli broj ≥ 1, jedinstven, neobavezan | Isti broj kao na društvenim mrežama. Prazno = zapis samo za stranicu (prikazuje se kao "UVOD") |
| status | izbor: draft, published | |
| event_start | datum | Prvi dan koji epizoda pokriva |
| event_end | datum | Zadnji dan koji pokriva; ≥ event_start |
| publish_date | datum | Kad se pojavi na stranici (može biti u budućnosti = zakazano) |
| excerpt | tekst (do 200 znakova) | |
| featured_image | slika + alternativni tekst | Obavezno kad je objavljeno |
| video_platform | izbor: none, youtube, instagram, tiktok, facebook | |
| video_url | URL | Obavezno osim ako je platforma none |
| content | Markdoc | Slike s opisima |
| tags | niz tekstova | |
| seo_title | tekst | Neobavezno |
| seo_description | tekst (do 160 znakova) | Neobavezno |
| day_range | *izračunato* | "Dan 27–31" iz datuma događaja |
| troškovi / sati epizode | *izračunato* | Troškovi i unosi vremenske crte s datumom unutar event_start…event_end |

Troškovi i unosi vremenske crte povezuju se s epizodama **samo prema rasponu datuma**; nema polja za ručno povezivanje.

#### 7.6 `expenses` (troškovi)
| Polje | Tip | Napomena |
|---|---|---|
| date | datum | |
| description | tekst | |
| category | veza → expense_categories | |
| supplier | tekst | Neobavezno |
| amount_eur | tekst `^\d+(\.\d{1,2})?$` | Pretvara se u cijeli broj centi. Bez računanja s decimalnim brojevima s pomičnim zarezom. |
| original_amount | isti format | Neobavezno, za drugu valutu |
| original_currency | ISO 4217 | Obavezno uz original_amount |
| phase | veza → phases | |
| visibility | izbor: public, amount_only | `amount_only` skriva opis i dobavljača |
| receipt_reference | tekst | Privatno, **nikad se ne prikazuje** |

Svi troškovi do graničnog datuma ulaze u sve zbrojeve, uključujući `amount_only`.

#### 7.7 `timeline_entries` (vremenska crta, odgovara evidenciji u Google Sheetsu)
| Polje | Tip | Napomena |
|---|---|---|
| date | datum | Obavezno |
| title | tekst | Što se dogodilo ("Radnja") |
| phase | veza → phases | |
| activity | izbor: radovi, proizvodnja, administracija, sadrzaj, ostalo | Obavezno kad je upisano trajanje |
| duration_minutes | cijeli broj > 0, neobavezno | Prazno za događaje bez radnog vremena (npr. "Suglasnost dobivena") |
| public | da/ne, zadano da | `ne` zauvijek ostavlja redak privatnim |

Poslodavac se na javnoj stranici nikad ne imenuje, osim ako je to izričito odobrio.

---

### 8. Izračuni (tijekom builda)

Cijeli brojevi centi i minuta; vremenska zona Europe/Zagreb; sve vrijednosti ograničene na granični datum (§6).

| Vrijednost | Definicija |
|---|---|
| Broj dana | `datum − project_start_date + 1` |
| Dan stanja | Broj dana graničnog datuma |
| Ukupno potrošeno | Zbroj troškova ≤ graničnog datuma |
| Potrošeno u zadnjoj epizodi | Troškovi unutar raspona datuma zadnje numerirane epizode |
| Ukupno sati | Zbroj `duration_minutes` ≤ graničnog datuma |
| Sati u zadnjoj epizodi | Isti raspon kao gore |
| Troškovi po kategorijama | Postoci metodom najvećeg ostatka (zbroj = 100 %) |
| Troškovi po mjesecima | Mjeseci od početka do mjeseca graničnog datuma; zadnji mjesec označen kao nepotpun ako granični datum nije njegov zadnji dan |
| Vrijeme po aktivnostima / fazama | Zbrojevi minuta |
| Prosjek po danu | Ukupno potrošeno / dan stanja |
| Ukupni napredak | `Σ(težina × f) / Σ(težina)`, f = 1 za završene, `progress_at_last_episode/100` za fazu u tijeku, 0 za planirane |
| Trajanje faze | `kraj − početak + 1` dana (završena); `granični datum − početak + 1` (u tijeku) |

Build mora **pasti** na neispravne podatke: dvostruki brojevi epizoda, neispravne veze, više od jedne faze u tijeku, neispravni iznosi, `event_end < event_start`, trajanje bez aktivnosti, objavljena epizoda bez naslovne slike.

---

### 9. Sadržaj stranica

**Početna `/`**: heroj → zadnje 3 epizode → napomena o graničnom datumu → kartice s brojkama (dan stanja, ukupno potrošeno + zadnja epizoda, sati + zadnja epizoda, napredak, trenutna faza) → troškovi po kategorijama, mjesečni troškovi, vrijeme po aktivnostima → faze + okvir "Prati projekt" s poveznicama na mreže → traka društvenih mreža.

**`/epizode`**: najnovije prvo, filtar po oznakama, značka "EP N" ili "UVOD", raspon dana, datumi.

**`/epizode/[slug]`**: značka, raspon dana, datumi, oznake, video koji se učitava na klik (ili naslovna slika), sažetak "U ovim danima: X € · Y h", sadržaj, redci vremenske crte i troškovi za taj raspon, prethodna / sljedeća epizoda.

**`/troskovi`**: napomena o graničnom datumu, kartice (ukupno, zadnja epizoda, prosjek po danu), grafikoni, popis po mjesecima s filtrom po kategorijama; svaki trošak vodi na svoju epizodu.

**`/napredak`**: napomena o graničnom datumu, ukupni napredak s objašnjenjem, faze s rasponom dana, troškovima i satima, prekretnice, vrijeme po aktivnostima i fazama, **vremenska crta po danima** grupirana po mjesecima.

---

### 10. Dizajn sustav

#### 10.1 Brend
Topla krem pozadina, crna tipografija, žuti naglasak, dostavljeni logo s čvorom i strelicom (potreban u SVG formatu), minimalistički urednički raspored, dokumentarna fotografija.

#### 10.2 Boje
| Oznaka | Upotreba |
|---|---|
| `cream` / `paper` | Pozadina stranice / kartica |
| `ink` | Tekst, glavni gumbi, traka mreža |
| `yellow` | Naglasak, zadnji mjesec, napredak, značke epizoda, glavni poziv na akciju |
| `yellow-soft` | Napomena o graničnom datumu, sažetak epizode |
| `chart-1 … chart-6` | Kategorije: crna, žuta, oker, glina, sivosmeđa, kadulja |

Rast troškova prikazuje se neutralnom bojom. Svi parovi teksta i pozadine zadovoljavaju WCAG AA kontrast.

#### 10.3 Tipografija
Uski teški grotesk za naziv brenda, podebljani grotesk za naslove, čitljivi sans za tekst; puna podrška za č ć đ š ž; fontovi se poslužuju s vlastitog hostinga.

#### 10.4 Formatiranje (`hr-HR`)
Novac `2.436 €` / `186,50 €`; datumi `10. stu 2026.`; postoci `38 %`; dani `Dan 27–31`; epizode `EP 4`.

#### 10.5 Raspored
Najprije mobitel. Na mobitelu: donja traka navigacije (Početna, Epizode, Troškovi, Napredak, O meni), bez hamburger izbornika; Kontakt i Privatnost u podnožju. Slike s fiksnim omjerima koje dobro izgledaju i s običnim fotografijama s mobitela. Grafikoni kao SVG u stranici s pristupačnom tekstualnom alternativom.

---

### 11. Privatnost i sigurnost

- Privatni repozitorij; skice, zakazane epizode, privatni redci vremenske crte i oznake računa postoje samo tamo i nikad u izlazu builda.
- GitHub 2FA obavezan; Keystatic GitHub App ograničen na ovaj repozitorij.
- EXIF metapodaci (uključujući GPS lokaciju) brišu se sa svake slike tijekom builda.
- Ugrađeni videozapisi učitavaju se tek nakon klika.
- Bez kolačića za praćenje.
- Poslodavac i druge treće osobe ne imenuju se bez pristanka.
- Sigurnosne kopije: Git povijest + povremena lokalna kopija repozitorija; računi se čuvaju u svojoj privatnoj mapi.

---

### 12. Uvoz iz Google Sheetsa (opcionalno, faza 6)

Vlasnik vodi glavnu evidenciju u Google Sheetsu sa stupcima:

`Datum | Radnja | Faza | Aktivnost | Sati | Javno`

i zaseban list za troškove:

`Datum | Opis | Kategorija | Dobavljač | Iznos (€) | Izvorni iznos | Valuta | Faza | Vidljivost`

Skripta pretvara CSV izvoze u datoteke `timeline_entries` i `expenses`, provjerava ih istim pravilima kao u §8 i javlja greške s brojem retka. Već uvezeni redci se ažuriraju, a ne dupliciraju (ključ: datum + radnja / datum + opis + iznos). Pristup Google API-ju nije potreban.

---

### 13. Pravila razvoja

Za svaku fazu: objasniti plan, navesti datoteke i kolekcije na koje utječe, implementirati, pokrenuti linting, provjeru tipova, jedinične testove (izračuni i pravila objave) i produkcijski build, provjeriti da se ništa nakon graničnog datuma ne pojavljuje u izlazu builda, izvijestiti o rezultatima.

Nikad ne izmišljati polja izvan §7. Promjene modela sadržaja zahtijevaju izmjenu §7 i, po potrebi, skriptu za migraciju. Ne počinjati sljedeću fazu dok trenutna nije pregledana.

---

### 14. Plan razvoja

| Faza | Sadržaj |
|---|---|
| 0 | Postavljanje projekta: Astro, TypeScript, Tailwind, boje i oznake dizajna, fontovi, osnovni raspored, navigacija, objava |
| 1 | Model sadržaja u Keystaticu (§7), validacija, probni sadržaj |
| 2 | Pravila objave i izračuni (§6, §8) s jediničnim testovima |
| 3 | Epizode: popis, stranica, video, SEO, sitemap, RSS |
| 4 | Stranica troškova |
| 5 | Stranica napretka s vremenskom crtom; slaganje početne stranice |
| 6 | Uvoz CSV-a iz Google Sheetsa |
| 7 | Kontakt, stranica privatnosti, analitika, brisanje EXIF podataka; završni pregled i pokretanje |

Početi **samo s fazom 0** i čekati odobrenje.

---

### 15. Otvorene odluke

1. Cloudflare Pages ili Netlify.
2. Naziv domene.
3. Logo u SVG formatu i prave fotografije.
4. Izbor fontova.
5. Smije li se spominjati poslodavac (zadano: samo kao "poslodavac", bez imena).
