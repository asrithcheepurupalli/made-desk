import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { checkProductsAction, type SiteCheck, type FoundLink } from "@/app/(dashboard)/products/sync";
import { saveProduct, removeProduct } from "./products";
import type { Product } from "./types";

const FILENAME = "products.json";
const LAST_KEY = "made-desk:product-sync";
const IGNORED_KEY = "made-desk:product-sync-ignored";
const DAY = 24 * 60 * 60 * 1000;
export const PRODUCT_SYNC_EVENT = "made-desk:product-sync";

export interface SyncReview {
  checkedAt: string;
  complete: boolean;
  applied: number;
  newOnSite: FoundLink[];
  goneFromSite: Array<{ id: string; name: string }>;
}

const readLS = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const writeLS = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

/** What still needs a decision, minus anything already ignored. */
export function getSyncReview(): SyncReview | null {
  const last = readLS<SyncReview | null>(LAST_KEY, null);
  if (!last) return null;
  const ignored = new Set(readLS<string[]>(IGNORED_KEY, []));
  return {
    ...last,
    newOnSite: last.newOnSite.filter((n) => !ignored.has(n.url)),
    goneFromSite: last.goneFromSite.filter((g) => !ignored.has(g.id)),
  };
}

export function ignoreSyncItem(key: string) {
  writeLS(IGNORED_KEY, [...new Set([...readLS<string[]>(IGNORED_KEY, []), key])]);
  window.dispatchEvent(new Event(PRODUCT_SYNC_EVENT));
}

export async function runProductSync(): Promise<SyncReview> {
  const items = await readJsonFile<Product[]>(FILENAME, []);
  const check: SiteCheck = await checkProductsAction(
    items.map((p) => ({ id: p.id, name: p.name, url: p.url, repo: p.repo, source: p.source, status: p.status, hidden: p.hidden }))
  );

  // Live or down status is fixed automatically. Everything else waits for a decision.
  let applied = 0;
  const now = new Date().toISOString();
  for (const c of check.statusChanges) {
    const p = items.find((x) => x.id === c.id);
    if (p && (p.status === "live" || p.status === "down")) {
      p.status = c.to as Product["status"];
      p.note = c.to === "down" ? `Link not answering (${c.http}) as of ${now.slice(0, 10)}.` : p.note.startsWith("Link not answering") ? "" : p.note;
      p.checked_at = now.slice(0, 10);
      p.updated_at = now;
      applied++;
    }
  }
  if (applied) await writeJsonFile(FILENAME, items);

  const review: SyncReview = { checkedAt: check.checkedAt, complete: check.complete, applied, newOnSite: check.newOnSite, goneFromSite: check.goneFromSite };
  writeLS(LAST_KEY, review);
  window.dispatchEvent(new Event(PRODUCT_SYNC_EVENT));
  return review;
}

/** Runs at most once a day, quietly. */
export async function maybeRunProductSync(): Promise<void> {
  const last = readLS<SyncReview | null>(LAST_KEY, null);
  if (last && Date.now() - new Date(last.checkedAt).getTime() < DAY) return;
  try {
    await runProductSync();
  } catch (err) {
    console.warn("[made. desk] Product site check failed:", err);
  }
}

export async function addFoundProduct(n: FoundLink): Promise<void> {
  await saveProduct({
    name: n.name,
    owner: n.owner,
    type: n.kind === "case" ? "Case study" : n.kind === "code" ? "Experiment" : "Product",
    status: n.kind === "code" ? "source_only" : "live",
    url: n.kind === "code" ? "" : n.url,
    repo: n.kind === "code" ? n.url : "",
    tagline: "",
    description: `Found on ${n.foundOn}. Edit this card to add a description and image.`,
    source: n.foundOn,
    note: "Added automatically: check the details.",
  });
  ignoreSyncItem(n.url);
}

export async function removeGoneProduct(id: string): Promise<void> {
  await removeProduct(id);
  ignoreSyncItem(id);
}
