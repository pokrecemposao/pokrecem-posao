/**
 * Model sadržaja (specifikacija §7). Admin: /keystatic
 *
 * Nazivi polja su na engleskom jer ih koristi kod; oznake u adminu su na hrvatskom.
 * Ne dodavati polja bez izmjene specifikacije (§7).
 */
import { collection, config, fields, singleton } from "@keystatic/core";

const AMOUNT = {
  regex: /^\d+(\.\d{1,2})?$/,
  message: "Upiši iznos s točkom, npr. 186.50",
};

const ACTIVITIES = [
  { label: "— (bez radnog vremena)", value: "none" },
  { label: "Radovi i uređenje", value: "radovi" },
  { label: "Priprema proizvodnje", value: "proizvodnja" },
  { label: "Administracija", value: "administracija" },
  { label: "Snimanje i sadržaj", value: "sadrzaj" },
  { label: "Ostalo", value: "ostalo" },
] as const;

const CHART_COLORS = [
  { label: "Crna", value: "chart-1" },
  { label: "Žuta", value: "chart-2" },
  { label: "Oker", value: "chart-3" },
  { label: "Glina", value: "chart-4" },
  { label: "Sivosmeđa", value: "chart-5" },
  { label: "Kadulja", value: "chart-6" },
] as const;

export default config({
  storage: {
    kind: "github",
    repo: "pokrecemposao/pokrecem-posao",
  },
  ui: {
    brand: { name: "Pokrećem posao" },
    navigation: {
      Priča: ["episodes"],
      Evidencija: ["timeline_entries", "expenses"],
      Projekt: ["phases", "milestones", "expense_categories"],
      Postavke: ["settings"],
    },
  },

  singletons: {
    settings: singleton({
      label: "Postavke stranice",
      path: "content/settings/",
      format: { data: "yaml" },
      schema: {
        site_title: fields.text({ label: "Naziv stranice", defaultValue: "POKREĆEM POSAO", validation: { isRequired: true } }),
        tagline: fields.text({ label: "Slogan", defaultValue: "Od 12 m² do vlastitog posla" }),
        project_start_date: fields.date({
          label: "Datum početka projekta",
          description: "Ovaj datum je Dan 1.",
          validation: { isRequired: true },
        }),
        hero_eyebrow: fields.text({ label: "Heroj: nadnaslov" }),
        hero_title: fields.text({ label: "Heroj: naslov" }),
        hero_text: fields.text({ label: "Heroj: tekst", multiline: true }),
        hero_image: fields.image({
          label: "Heroj: fotografija",
          directory: "public/images/settings",
          publicPath: "/images/settings/",
        }),
        hero_image_alt: fields.text({ label: "Heroj: opis fotografije (za slabovidne)" }),
        about_content: fields.markdoc({
          label: "Stranica O meni",
          options: { image: { directory: "public/images/settings", publicPath: "/images/settings/" } },
        }),
        contact_email: fields.text({ label: "E-mail za kontakt" }),
        social_links: fields.array(
          fields.object({
            platform: fields.select({
              label: "Mreža",
              options: [
                { label: "Instagram", value: "instagram" },
                { label: "YouTube", value: "youtube" },
                { label: "TikTok", value: "tiktok" },
                { label: "Facebook", value: "facebook" },
              ],
              defaultValue: "instagram",
            }),
            handle: fields.text({ label: "Korisničko ime", description: "npr. @pokrecemposao" }),
            url: fields.url({ label: "Poveznica na profil" }),
          }),
          { label: "Društvene mreže", itemLabel: (props) => props.fields.platform.value },
        ),
      },
    }),
  },

  collections: {
    episodes: collection({
      label: "Epizode",
      slugField: "title",
      path: "content/episodes/*",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["episode_number", "status", "publish_date"],
      schema: {
        title: fields.slug({ name: { label: "Naslov", validation: { isRequired: true } } }),
        episode_number: fields.integer({
          label: "Broj epizode",
          description: "Isti broj kao na mrežama. Ostavi prazno za zapis koji postoji samo na stranici (UVOD).",
          validation: { min: 1 },
        }),
        status: fields.select({
          label: "Status",
          options: [
            { label: "Skica", value: "draft" },
            { label: "Objavljeno", value: "published" },
          ],
          defaultValue: "draft",
        }),
        event_start: fields.date({ label: "Prvi dan koji epizoda pokriva", validation: { isRequired: true } }),
        event_end: fields.date({ label: "Zadnji dan koji epizoda pokriva", validation: { isRequired: true } }),
        publish_date: fields.date({
          label: "Datum objave na stranici",
          description: "Može biti u budućnosti: epizoda se tada pojavi sama na taj dan.",
          validation: { isRequired: true },
        }),
        excerpt: fields.text({ label: "Kratki opis", multiline: true, validation: { length: { max: 200 } } }),
        featured_image: fields.image({
          label: "Naslovna fotografija",
          description: "Obavezna kad je epizoda objavljena.",
          directory: "public/images/episodes",
          publicPath: "/images/episodes/",
        }),
        featured_image_alt: fields.text({ label: "Opis naslovne fotografije (za slabovidne)" }),
        video_platform: fields.select({
          label: "Video",
          options: [
            { label: "Bez videa", value: "none" },
            { label: "YouTube", value: "youtube" },
            { label: "Instagram", value: "instagram" },
            { label: "TikTok", value: "tiktok" },
            { label: "Facebook", value: "facebook" },
          ],
          defaultValue: "none",
        }),
        video_url: fields.url({ label: "Poveznica na video" }),
        tags: fields.array(fields.text({ label: "Oznaka" }), {
          label: "Oznake",
          itemLabel: (props) => props.value,
        }),
        seo_title: fields.text({ label: "SEO naslov (neobavezno)" }),
        seo_description: fields.text({
          label: "SEO opis (neobavezno)",
          multiline: true,
          validation: { length: { max: 160 } },
        }),
        content: fields.markdoc({
          label: "Tekst",
          options: { image: { directory: "public/images/episodes", publicPath: "/images/episodes/" } },
        }),
      },
    }),

    timeline_entries: collection({
      label: "Vremenska crta",
      slugField: "title",
      path: "content/timeline/*",
      format: { data: "yaml" },
      columns: ["date", "duration_minutes"],
      schema: {
        title: fields.slug({ name: { label: "Što se dogodilo", validation: { isRequired: true } } }),
        date: fields.date({ label: "Datum", validation: { isRequired: true } }),
        phase: fields.relationship({ label: "Faza", collection: "phases", validation: { isRequired: true } }),
        activity: fields.select({
          label: "Aktivnost",
          description: "Obavezno ako upisuješ trajanje.",
          options: ACTIVITIES,
          defaultValue: "none",
        }),
        duration_minutes: fields.integer({
          label: "Trajanje u minutama",
          description: "Prazno za događaje bez radnog vremena, npr. 'Suglasnost dobivena'.",
          validation: { min: 1 },
        }),
        public: fields.checkbox({
          label: "Javno",
          description: "Isključi da redak zauvijek ostane privatan.",
          defaultValue: true,
        }),
      },
    }),

    expenses: collection({
      label: "Troškovi",
      slugField: "description",
      path: "content/expenses/*",
      format: { data: "yaml" },
      columns: ["date", "amount_eur"],
      schema: {
        description: fields.slug({ name: { label: "Opis", validation: { isRequired: true } } }),
        date: fields.date({ label: "Datum", validation: { isRequired: true } }),
        category: fields.relationship({
          label: "Kategorija",
          collection: "expense_categories",
          validation: { isRequired: true },
        }),
        supplier: fields.text({ label: "Dobavljač (neobavezno)" }),
        amount_eur: fields.text({
          label: "Iznos u eurima",
          description: "S točkom, npr. 186.50",
          validation: { isRequired: true, pattern: AMOUNT },
        }),
        original_amount: fields.text({
          label: "Izvorni iznos (neobavezno)",
          description: "Za kupnje u drugoj valuti, npr. 58.00",
          validation: { pattern: { regex: /^$|^\d+(\.\d{1,2})?$/, message: AMOUNT.message } },
        }),
        original_currency: fields.text({
          label: "Izvorna valuta",
          description: "Troslovna oznaka, npr. USD. Obavezno uz izvorni iznos.",
          validation: { pattern: { regex: /^$|^[A-Z]{3}$/, message: "Tri velika slova, npr. USD" } },
        }),
        phase: fields.relationship({ label: "Faza", collection: "phases", validation: { isRequired: true } }),
        visibility: fields.select({
          label: "Vidljivost",
          options: [
            { label: "Javno", value: "public" },
            { label: "Samo iznos (bez opisa i dobavljača)", value: "amount_only" },
          ],
          defaultValue: "public",
        }),
        receipt_reference: fields.text({
          label: "Oznaka računa (privatno)",
          description: "Npr. naziv datoteke u Driveu. Nikad se ne prikazuje na stranici.",
        }),
      },
    }),

    phases: collection({
      label: "Faze",
      slugField: "title",
      path: "content/phases/*",
      format: { data: "yaml" },
      columns: ["order", "start_date", "end_date"],
      schema: {
        title: fields.slug({ name: { label: "Naziv", validation: { isRequired: true } } }),
        order: fields.integer({ label: "Redni broj", validation: { isRequired: true, min: 1 } }),
        weight: fields.integer({
          label: "Težina",
          description: "Relativna veličina faze u ukupnom napretku.",
          defaultValue: 1,
          validation: { isRequired: true, min: 1 },
        }),
        start_date: fields.date({ label: "Početak", description: "Prazno dok faza ne počne." }),
        end_date: fields.date({ label: "Kraj", description: "Prazno dok faza ne završi." }),
        progress_at_last_episode: fields.integer({
          label: "Napredak u zadnjoj objavljenoj epizodi (%)",
          defaultValue: 0,
          validation: { min: 0, max: 100 },
        }),
        description: fields.text({ label: "Opis", multiline: true }),
      },
    }),

    milestones: collection({
      label: "Prekretnice",
      slugField: "title",
      path: "content/milestones/*",
      format: { data: "yaml" },
      columns: ["date"],
      schema: {
        title: fields.slug({ name: { label: "Naziv", validation: { isRequired: true } } }),
        date: fields.date({ label: "Datum", validation: { isRequired: true } }),
        phase: fields.relationship({ label: "Faza", collection: "phases", validation: { isRequired: true } }),
      },
    }),

    expense_categories: collection({
      label: "Kategorije troškova",
      slugField: "name",
      path: "content/expense-categories/*",
      format: { data: "yaml" },
      columns: ["order"],
      schema: {
        name: fields.slug({ name: { label: "Naziv", validation: { isRequired: true } } }),
        order: fields.integer({ label: "Redni broj", validation: { isRequired: true, min: 1 } }),
        color: fields.select({ label: "Boja u grafikonu", options: CHART_COLORS, defaultValue: "chart-1" }),
      },
    }),
  },
});
