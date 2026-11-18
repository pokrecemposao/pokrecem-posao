/**
 * Dijagnostika za admin: pokazuje SAMO postoje li ključevi (da/ne), nikad njihove vrijednosti.
 * Otvori /api/admin-status ako prijava u /keystatic ne radi.
 */
import type { APIRoute } from "astro";

export const prerender = false;

type RuntimeEnv = Record<string, unknown>;

export const GET: APIRoute = ({ locals }) => {
  const runtime = ((locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {}) as RuntimeEnv;
  const has = (v: unknown) => typeof v === "string" && v.length > 0;

  const build: Record<string, boolean> = {
    KEYSTATIC_GITHUB_CLIENT_ID: has(import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID),
    KEYSTATIC_GITHUB_CLIENT_SECRET: has(import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET),
    KEYSTATIC_SECRET: has(import.meta.env.KEYSTATIC_SECRET),
    PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: has(import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG),
  };
  const result = Object.fromEntries(
    Object.keys(build).map((k) => [k, { u_radu: has(runtime[k]), pri_buildu: build[k] }]),
  );

  return new Response(JSON.stringify(result, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
};
