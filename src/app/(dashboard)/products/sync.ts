"use server";

/*
 * Stateless site check for the Hall of Products. The browser sends its product list; this reads the
 * live studio and portfolio sites (rendered through Jina, since they are JavaScript apps), pings every
 * product link, and reports what changed. Nothing is stored here.
 */

export interface SyncInput {
  id: string;
  name: string;
  url: string;
  repo: string;
  source: string;
  status: string;
  hidden?: boolean;
}

export interface FoundLink {
  name: string;
  url: string;
  foundOn: string;
  owner: "made" | "asrith";
  kind: "case" | "product" | "code";
}

export interface SiteCheck {
  checkedAt: string;
  pagesRead: number;
  /** false when a key page could not be read, so new/gone detection was skipped */
  complete: boolean;
  statusChanges: Array<{ id: string; from: string; to: string; http: string }>;
  newOnSite: FoundLink[];
  goneFromSite: Array<{ id: string; name: string }>;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const PAGES: Array<{ key: string; url: string; owner: "made" | "asrith"; required: boolean }> = [
  { key: "made-by-ac.com", url: "https://www.made-by-ac.com/", owner: "made", required: false },
  { key: "made-by-ac.com/work", url: "https://www.made-by-ac.com/work", owner: "made", required: true },
  { key: "made-by-ac.com/labs", url: "https://www.made-by-ac.com/labs", owner: "made", required: true },
  { key: "asrithcheepurupalli.tech/projects", url: "https://asrithcheepurupalli.tech/projects", owner: "asrith", required: false },
  { key: "asrithcheepurupalli.tech/vibe", url: "https://asrithcheepurupalli.tech/vibe", owner: "asrith", required: false },
];

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n]);
      }
    })
  );
  return out;
}

/** host + path, lowercase, no www, no trailing slash, no query or hash */
function norm(u: string): string {
  try {
    const x = new URL(u);
    return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

async function readPage(url: string): Promise<string> {
  // One retry: the reader occasionally rate-limits a burst
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: "text/markdown", "User-Agent": UA }, signal: AbortSignal.timeout(40000) });
      if (res.ok) return await res.text();
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return "";
}

async function readSitemap(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  } catch {
    return [];
  }
}

const titleFromSlug = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Markdown links as {text, url}. Link text can contain image syntax, so scan back to the matching bracket. */
function extractLinks(md: string): Array<{ text: string; url: string }> {
  const out: Array<{ text: string; url: string }> = [];
  const re = /\]\((https?:\/\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    let depth = 0;
    let start = -1;
    for (let k = m.index; k >= 0 && m.index - k < 600; k--) {
      const c = md[k];
      if (c === "]") depth++;
      else if (c === "[") {
        depth--;
        if (depth === 0) {
          start = k;
          break;
        }
      }
    }
    if (start < 0) continue;
    if (md[start - 1] === "!") continue; // an image, not a link
    const text = md
      .slice(start + 1, m.index)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/[#*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ text, url: m[1] });
  }
  return out;
}

function classify(url: string): FoundLink["kind"] | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname.replace(/\/+$/, "");
  if (/\.(apk|pdf|png|jpe?g|webp|svg|zip)$/i.test(path)) return null;
  if (host === "made-by-ac.com") return /^\/work\/[^/]+$/.test(path) ? "case" : null;
  if (host.endsWith(".made-by-ac.com")) return "product";
  if (/\.(vercel\.app|netlify\.app|onrender\.com|run\.app)$/.test(host)) return "product";
  if (host === "github.com") return /^\/asrithcheepurupalli\/[^/]+$/.test(path) ? "code" : null;
  if (host === "supermind.ink" || host === "percentyle.in") return "product";
  return null;
}

async function ping(url: string): Promise<{ state: "up" | "down" | "unknown"; http: string }> {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(14000) });
    res.body?.cancel().catch(() => {});
    if (res.status < 400) return { state: "up", http: String(res.status) };
    if (res.status === 404 || res.status === 410 || res.status >= 500) return { state: "down", http: String(res.status) };
    return { state: "unknown", http: String(res.status) }; // 401, 403, 429: blocked, not necessarily dead
  } catch (err) {
    return { state: "down", http: err instanceof Error && err.name === "TimeoutError" ? "timeout" : "unreachable" };
  }
}

export async function checkProductsAction(products: SyncInput[]): Promise<SiteCheck> {
  // 1. Is every live link still answering?
  const toPing = products.filter((p) => p.url && !p.hidden && (p.status === "live" || p.status === "down"));
  const pings = await pool(toPing, 8, async (p) => ({ p, r: await ping(p.url) }));
  const statusChanges: SiteCheck["statusChanges"] = [];
  for (const { p, r } of pings) {
    if (r.state === "up" && p.status === "down") statusChanges.push({ id: p.id, from: "down", to: "live", http: r.http });
    if (r.state === "down" && p.status === "live") statusChanges.push({ id: p.id, from: "live", to: "down", http: r.http });
  }

  // 2. What do the sites say right now? The sitemap is always readable; the rendered pages are a bonus.
  const [sitemap, pages] = await Promise.all([
    readSitemap("https://www.made-by-ac.com/sitemap.xml"),
    pool(PAGES, 3, async (pg) => ({ pg, md: await readPage(pg.url) })),
  ]);
  const readable = pages.filter((x) => x.md.length > 1500 || (!x.pg.required && x.md.length > 600));
  const textRead = PAGES.every((pg) => !pg.required || readable.some((x) => x.pg.key === pg.key));
  const sitemapRead = sitemap.length > 20;
  const result: SiteCheck = {
    checkedAt: new Date().toISOString(),
    pagesRead: readable.length + (sitemapRead ? 1 : 0),
    complete: textRead || sitemapRead,
    statusChanges,
    newOnSite: [],
    goneFromSite: [],
  };
  if (!result.complete) return result;

  const known = new Set<string>();
  const knownSlugs: string[] = [];
  for (const p of products) {
    if (p.url) known.add(norm(p.url));
    if (p.repo) known.add(norm(p.repo));
    knownSlugs.push(p.id.toLowerCase(), p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  const isKnown = (url: string) => {
    const n = norm(url);
    if (known.has(n)) return true;
    const last = n.split("/").pop() || "";
    return knownSlugs.some((s) => s && (last === s || last.startsWith(s + "-") || s.startsWith(last + "-")) && last.length > 3);
  };

  const seen = new Set<string>();
  const addNew = (f: FoundLink) => {
    const key = norm(f.url);
    if (seen.has(key)) return;
    seen.add(key);
    result.newOnSite.push(f);
  };

  // New case studies from the sitemap
  if (sitemapRead) {
    for (const loc of sitemap) {
      if (/^made-by-ac\.com\/work\/[^/]+$/.test(norm(loc)) && !isKnown(loc)) {
        addNew({ name: titleFromSlug(norm(loc).split("/").pop()!), url: loc, foundOn: "made-by-ac.com sitemap", owner: "made", kind: "case" });
      }
    }
  }
  // New products and code links from the rendered pages
  if (textRead || readable.length) {
    for (const { pg, md } of readable) {
      for (const l of extractLinks(md)) {
        const kind = classify(l.url);
        if (!kind || isKnown(l.url)) continue;
        const fallback = norm(l.url).split("/").pop() || l.url;
        addNew({
          name: (l.text && l.text.length <= 60 ? l.text : fallback).replace(/\s+(READ|VISIT|LIVE DEMO).*$/i, "").trim() || fallback,
          url: l.url,
          foundOn: pg.key,
          owner: pg.owner,
          kind,
        });
      }
    }
  }

  // 3. Things we sourced from these sites that they no longer show
  const gone = new Map<string, string>();
  if (sitemapRead) {
    const locs = new Set(sitemap.map(norm));
    for (const p of products) {
      if (p.hidden || !p.url) continue;
      const n = norm(p.url);
      // Only case-study pages: concept sites like /aavira are deliberately left out of the sitemap
      if (/^made-by-ac\.com\/work\/[^/]+$/.test(n) && !locs.has(n)) gone.set(p.id, p.name);
    }
  }
  if (textRead) {
    const corpus = readable.map((x) => x.md).join("\n").toLowerCase();
    const corpusLinks = new Set(readable.flatMap((x) => extractLinks(x.md).map((l) => norm(l.url))));
    const selfHosts = new Set(PAGES.map((p) => norm(p.url).split("/")[0]));
    for (const p of products) {
      if (p.hidden || !/made-by-ac\.com|asrithcheepurupalli\.tech/.test(p.source)) continue;
      if (p.url && selfHosts.has(norm(p.url).split("/")[0]) && norm(p.url).split("/").length <= 2) continue; // the sites themselves
      const nameKey = p.name.toLowerCase().replace(/\.$/, "").trim();
      const onSite = corpus.includes(nameKey) || (p.url && corpusLinks.has(norm(p.url))) || (p.repo && corpusLinks.has(norm(p.repo)));
      if (!onSite && !(sitemapRead && p.url && sitemap.map(norm).includes(norm(p.url)))) gone.set(p.id, p.name);
    }
  }
  result.goneFromSite = [...gone].map(([id, name]) => ({ id, name }));
  return result;
}
