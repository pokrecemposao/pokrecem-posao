/**
 * Privremene postavke stranice.
 * U fazi 1 ovo prelazi u Keystatic (`settings`, specifikacija §7.1).
 */

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "book" | "coins" | "trend" | "user";
}

export interface SocialLink {
  platform: "instagram" | "youtube" | "tiktok" | "facebook";
  label: string;
  handle: string;
}

export const SITE = {
  title: "POKREĆEM POSAO",
  tagline: "Od 12 m² do vlastitog posla",
  description:
    "Stvarni proces pokretanja posla uzgoja mikrozelenja: prostor, papirologija, troškovi, rad i prvi kupci. Bez uljepšavanja.",
  projectStartDate: "2026-11-05",
  locale: "hr-HR",
  timeZone: "Europe/Zagreb",
} as const;

export const NAV: readonly NavItem[] = [
  { href: "/", label: "Početna", icon: "home" },
  { href: "/epizode/", label: "Epizode", icon: "book" },
  { href: "/troskovi/", label: "Troškovi", icon: "coins" },
  { href: "/napredak/", label: "Napredak", icon: "trend" },
  { href: "/o-meni/", label: "O meni", icon: "user" },
];

export const FOOTER_LINKS = [
  { href: "/kontakt/", label: "Kontakt" },
  { href: "/privatnost/", label: "Privatnost" },
] as const;

export const SOCIAL: readonly SocialLink[] = [
  { platform: "instagram", label: "Instagram", handle: "@pokrecemposao" },
  { platform: "youtube", label: "YouTube", handle: "Pokrećem posao" },
  { platform: "tiktok", label: "TikTok", handle: "@pokrecemposao" },
  { platform: "facebook", label: "Facebook", handle: "Pokrećem posao" },
];
