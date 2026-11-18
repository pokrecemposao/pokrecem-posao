/**
 * Rad s GitHubom u ime prijavljenog urednika.
 * Token je onaj koji admin (Keystatic) sprema u kolačić nakon GitHub prijave.
 */
export const REPO = "pokrecemposao/pokrecem-posao";
export const BRANCH = "main";
export const TOKEN_COOKIE = "keystatic-gh-access-token";

const API = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "pokrecem-posao",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Ima li token pristup privatnom repozitoriju (tj. je li ovo urednik). */
export async function hasRepoAccess(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const r = await fetch(`${API}/repos/${REPO}`, { headers: headers(token) });
    return r.ok;
  } catch {
    return false;
  }
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Napravi novu datoteku "dir/slug.yaml". Ako postoji, pokuša "slug-2.yaml", "slug-3.yaml"…
 * Nikad ne prepisuje postojeću datoteku.
 */
export async function createYamlFile(
  token: string,
  dir: string,
  slug: string,
  yaml: string,
  message: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  for (let i = 1; i <= 20; i++) {
    const path = `${dir}/${i === 1 ? slug : `${slug}-${i}`}.yaml`;
    const url = `${API}/repos/${REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
    try {
      const exists = await fetch(`${url}?ref=${BRANCH}`, { headers: headers(token) });
      if (exists.ok) continue;
      if (exists.status !== 404) return { ok: false, error: `GitHub je odbio provjeru (${exists.status}). Pokušaj ponovno.` };

      const put = await fetch(url, {
        method: "PUT",
        headers: { ...headers(token), "Content-Type": "application/json" },
        body: JSON.stringify({ message, content: toBase64(yaml), branch: BRANCH }),
      });
      if (put.ok) return { ok: true, path };
      if (put.status === 422) continue; // u međuvremenu je nastala datoteka istog imena
      if (put.status === 401) return { ok: false, error: "Prijava je istekla. Otvori admin pa pokušaj ponovno." };
      if (put.status === 403 || put.status === 404) return { ok: false, error: "Nema dopuštenja za spremanje. Provjeri dopuštenja GitHub aplikacije (Contents: Read and write)." };
      return { ok: false, error: `GitHub je odbio spremanje (${put.status}). Pokušaj ponovno.` };
    } catch {
      return { ok: false, error: "Veza s GitHubom nije uspjela. Pokušaj ponovno." };
    }
  }
  return { ok: false, error: "Previše unosa s istim nazivom. Promijeni opis." };
}
