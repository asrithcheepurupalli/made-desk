import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import type { MasterSop } from "./types";

const FILENAME = "masters.json";

export async function listMasters(): Promise<MasterSop[]> {
  const items = await readJsonFile<MasterSop[]>(FILENAME, []);
  return [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getMasterBySlug(slug: string): Promise<MasterSop | null> {
  const clean = decodeURIComponent(slug).toLowerCase().trim();
  const items = await readJsonFile<MasterSop[]>(FILENAME, []);
  return items.find((m) => m.slug.toLowerCase() === clean || m.id === clean) ?? null;
}

/** Insert or replace a master by id. */
export async function saveMaster(master: MasterSop): Promise<MasterSop> {
  const items = await readJsonFile<MasterSop[]>(FILENAME, []);
  const idx = items.findIndex((m) => m.id === master.id);
  const next = { ...master, updated_at: new Date().toISOString() };
  if (idx === -1) items.unshift(next);
  else items[idx] = next;
  await writeJsonFile(FILENAME, items);
  return next;
}

export async function deleteMaster(id: string): Promise<void> {
  const items = await readJsonFile<MasterSop[]>(FILENAME, []);
  await writeJsonFile(FILENAME, items.filter((m) => m.id !== id));
}
