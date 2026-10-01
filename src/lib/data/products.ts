import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { SEED_PRODUCTS, PRODUCT_SEED_VERSION, PRODUCT_CHECKED_AT } from "./products-seed";
import type { Product } from "./types";

const FILENAME = "products.json";

/** Visible products only (soft-deleted ones stay in storage so seeds do not reappear). */
export async function listProducts(): Promise<Product[]> {
  const items = await readJsonFile<Product[]>(FILENAME, []);
  return items.filter((p) => !p.hidden);
}

/**
 * Adds the researched products on first load, and refreshes seeded entries that were never
 * edited when the seed list is updated. Anything edited or added by hand is left alone.
 */
export async function ensureProductSeed(): Promise<void> {
  const items = await readJsonFile<Product[]>(FILENAME, []);
  const byId = new Map(items.map((p) => [p.id, p]));
  const now = new Date().toISOString();
  let changed = false;

  for (const seed of SEED_PRODUCTS) {
    const cur = byId.get(seed.id);
    if (!cur) {
      items.push({ ...seed, checked_at: PRODUCT_CHECKED_AT, seed_version: PRODUCT_SEED_VERSION, created_at: now, updated_at: now });
      changed = true;
    } else if (!cur.edited && (cur.seed_version || 0) < PRODUCT_SEED_VERSION) {
      Object.assign(cur, seed, { checked_at: PRODUCT_CHECKED_AT, seed_version: PRODUCT_SEED_VERSION, updated_at: now });
      changed = true;
    }
  }
  if (changed) await writeJsonFile(FILENAME, items);
}

export async function saveProduct(input: Partial<Product> & { name: string }): Promise<Product> {
  const items = await readJsonFile<Product[]>(FILENAME, []);
  const now = new Date().toISOString();
  const slug = input.id || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
  const idx = items.findIndex((p) => p.id === slug);
  const base: Product =
    idx === -1
      ? { id: slug, name: input.name, owner: "made", type: "Product", status: "live", url: "", repo: "", tagline: "", description: "", tags: [], source: "added by hand", note: "", image: "", checked_at: now.slice(0, 10), created_at: now, updated_at: now }
      : items[idx];
  const next: Product = { ...base, ...input, id: slug, edited: true, hidden: false, updated_at: now };
  if (idx === -1) items.unshift(next);
  else items[idx] = next;
  await writeJsonFile(FILENAME, items);
  return next;
}

export async function removeProduct(id: string): Promise<void> {
  const items = await readJsonFile<Product[]>(FILENAME, []);
  const seeded = SEED_PRODUCTS.some((s) => s.id === id);
  const next = seeded ? items.map((p) => (p.id === id ? { ...p, hidden: true, edited: true } : p)) : items.filter((p) => p.id !== id);
  await writeJsonFile(FILENAME, next);
}
