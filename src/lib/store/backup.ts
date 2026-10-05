"use client";

import { readJsonFile, writeJsonFile, STORE_FILES } from "@/lib/supabase/filestore";

export async function exportBackup(): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const file of STORE_FILES) payload[file] = await readJsonFile<unknown[]>(file, []);
  const blob = new Blob([JSON.stringify({ app: "made-desk", version: 1, exported_at: new Date().toISOString(), data: payload }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `made-desk-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Merges a backup into what is already here: rows with a new id are added, rows with a known id are
 * replaced by the file's version, and everything else is kept. Importing never deletes anything.
 */
export async function importBackup(file: File): Promise<number> {
  const parsed = JSON.parse(await file.text());
  if (parsed?.app !== "made-desk" || typeof parsed.data !== "object") {
    throw new Error("This is not a made. desk backup file.");
  }
  let added = 0;
  for (const name of STORE_FILES) {
    const incoming = parsed.data[name];
    if (!Array.isArray(incoming) || incoming.length === 0) continue;
    const current = await readJsonFile<any[]>(name, []);
    const byId = new Map(current.map((r) => [r?.id, r]));
    for (const row of incoming) {
      if (!byId.has(row?.id)) added++;
      byId.set(row?.id, row);
    }
    const hasIds = incoming.every((r) => r && r.id !== undefined);
    await writeJsonFile(name, hasIds ? [...byId.values()] : incoming);
  }
  return added;
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}
