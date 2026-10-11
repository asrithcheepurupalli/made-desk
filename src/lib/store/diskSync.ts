"use client";

import { readJsonFile, STORE_EVENT, STORE_FILES } from "@/lib/supabase/filestore";
import { importBackup } from "./backup";

/*
 * Mirrors the browser store into a real folder (pick ~/made-desk/.data once) so Claude Code,
 * the desk CLI and the MCP server can read every SOP. The browser stays the source of truth.
 * Uses the File System Access API (Chrome / Edge / Arc / Brave).
 */

const HANDLE_DB = "made-desk-handle";
const HANDLE_STORE = "h";
const HANDLE_KEY = "dir";
const LAST_SYNC_KEY = "made-desk:last-disk-sync";
const LAST_BACKUP_KEY = "made-desk:last-disk-backup";
const BACKUP_DIR = "backups";
const ARCHIVE_FILE = "made-desk-archive-all-time.json";
const BACKUP_EVERY_MS = 10 * 60 * 1000;
const DAILY_RE = /^made-desk-backup-\d{4}-\d{2}-\d{2}\.json$/;

export type LinkState = {
  supported: boolean;
  linked: boolean;
  permission: "granted" | "prompt" | "denied" | "none";
  lastSync?: number;
  lastBackup?: number;
  folder?: string;
  error?: string;
};

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
};

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadHandle(): Promise<DirHandle | null> {
  try {
    const db = await openHandleDb();
    return await new Promise((resolve) => {
      const r = db.transaction(HANDLE_STORE).objectStore(HANDLE_STORE).get(HANDLE_KEY);
      r.onsuccess = () => resolve((r.result as DirHandle) ?? null);
      r.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveHandle(handle: DirHandle | null): Promise<void> {
  const db = await openHandleDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    if (handle) tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    else tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function diskSyncSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function getLinkState(): Promise<LinkState> {
  if (!diskSyncSupported()) return { supported: false, linked: false, permission: "none" };
  const handle = await loadHandle();
  const last = Number(localStorage.getItem(LAST_SYNC_KEY)) || undefined;
  const lastBackup = Number(localStorage.getItem(LAST_BACKUP_KEY)) || undefined;
  if (!handle) return { supported: true, linked: false, permission: "none" };
  let permission: LinkState["permission"] = "prompt";
  try {
    permission = ((await handle.queryPermission?.({ mode: "readwrite" })) as LinkState["permission"]) || "prompt";
  } catch {}
  return { supported: true, linked: true, permission, lastSync: last, lastBackup, folder: handle.name };
}

/** Write every store file into the folder. Images are dropped: Claude only needs the text. */
export async function writeSnapshot(dir: FileSystemDirectoryHandle): Promise<void> {
  for (const name of STORE_FILES) {
    let rows = await readJsonFile<any[]>(name, []);
    if (name === "captures.json") rows = rows.map((r) => ({ ...r, screenshots: undefined }));
    // SOPs and client notes embed screenshots as image blocks. Claude reads text, so drop the pixels.
    if (name === "playbooks.json" || name === "clients.json") {
      rows = rows.map((r) => ({
        ...r,
        content: Array.isArray(r.content) ? r.content.map((b: any) => (b?.type === "image" ? { ...b, url: undefined } : b)) : r.content,
      }));
    }
    if (name === "products.json") rows = rows.map((r) => (typeof r.image === "string" && r.image.startsWith("data:") ? { ...r, image: "" } : r));
    const file = await dir.getFileHandle(name, { create: true });
    // An empty store (cleared browser data) must never replace a folder that still has your data.
    if (rows.length === 0) {
      const existing = (await (await file.getFile()).text()).trim();
      if (existing && existing !== "[]") continue;
    }
    const w = await file.createWritable();
    await w.write(JSON.stringify(rows, null, 2));
    await w.close();
  }
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function listBackups(sub: FileSystemDirectoryHandle): Promise<string[]> {
  const names: string[] = [];
  for await (const [name] of (sub as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
    if (/^made-desk-backup-.*\.json$/.test(name)) names.push(name);
  }
  return names.sort();
}

async function countRows(sub: FileSystemDirectoryHandle, name: string): Promise<number> {
  try {
    const parsed = JSON.parse(await (await (await sub.getFileHandle(name)).getFile()).text());
    return Object.values(parsed?.data ?? {}).reduce((n: number, v) => n + (Array.isArray(v) ? v.length : 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Adds every row to <folder>/backups/made-desk-archive-all-time.json, keyed by id. Rows are only ever
 * added or updated, never removed, so anything you once had (even if you later delete it in the app)
 * stays on disk.
 */
async function updateArchive(sub: FileSystemDirectoryHandle, data: Record<string, unknown[]>): Promise<void> {
  let archive: Record<string, any[]> = {};
  try {
    const parsed = JSON.parse(await (await (await sub.getFileHandle(ARCHIVE_FILE)).getFile()).text());
    if (parsed?.app === "made-desk" && parsed.data) archive = parsed.data;
  } catch {}
  for (const name of STORE_FILES) {
    const rows = data[name] as any[];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const merged = new Map<unknown, any>((archive[name] ?? []).map((r, i) => [r?.id ?? `__${i}`, r]));
    rows.forEach((r, i) => merged.set(r?.id ?? `${name}-${i}`, r));
    archive[name] = [...merged.values()];
  }
  const handle = await sub.getFileHandle(ARCHIVE_FILE, { create: true });
  const w = await handle.createWritable();
  await w.write(JSON.stringify({ app: "made-desk", version: 1, kind: "archive", exported_at: new Date().toISOString(), data: archive }));
  await w.close();
}

/**
 * A full, importable copy (screenshots included) in <folder>/backups/, one file per day, none ever
 * deleted. If the store suddenly holds under half of what the last backup had, it is written to a
 * separate "-SHRUNK-" file so a bad state cannot replace a good day.
 */
export async function writeBackup(dir: FileSystemDirectoryHandle): Promise<{ file: string; rows: number }> {
  const data: Record<string, unknown[]> = {};
  let rows = 0;
  for (const name of STORE_FILES) {
    const r = await readJsonFile<unknown[]>(name, []);
    data[name] = r;
    rows += r.length;
  }
  const sub = await dir.getDirectoryHandle(BACKUP_DIR, { create: true });
  const names = await listBackups(sub);
  const newest = names[names.length - 1];
  const prevRows = newest ? await countRows(sub, newest) : 0;
  const shrunk = prevRows >= 10 && rows < prevRows * 0.5;
  const now = new Date();
  const stamp = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const file = shrunk ? `made-desk-backup-${today()}-SHRUNK-${stamp}.json` : `made-desk-backup-${today()}.json`;
  const handle = await sub.getFileHandle(file, { create: true });
  const w = await handle.createWritable();
  await w.write(JSON.stringify({ app: "made-desk", version: 1, exported_at: now.toISOString(), data }));
  await w.close();
  await updateArchive(sub, data);
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
  return { file, rows };
}

async function storeIsEmpty(): Promise<boolean> {
  for (const name of STORE_FILES) if ((await readJsonFile<unknown[]>(name, [])).length > 0) return false;
  return true;
}

/** Merge the newest dated backup (or the mirror files) from the folder into an empty store. */
export async function restoreFromFolder(dir: FileSystemDirectoryHandle): Promise<number> {
  try {
    const sub = await dir.getDirectoryHandle(BACKUP_DIR);
    const names = (await listBackups(sub)).filter((n) => DAILY_RE.test(n));
    const newest = names[names.length - 1];
    if (newest) return await importBackup(await (await sub.getFileHandle(newest)).getFile());
  } catch {}
  // No dated backup: rebuild from the plain mirror files.
  const data: Record<string, unknown[]> = {};
  for (const name of STORE_FILES) {
    try {
      data[name] = JSON.parse(await (await (await dir.getFileHandle(name)).getFile()).text());
    } catch {}
  }
  const blob = new File([JSON.stringify({ app: "made-desk", version: 1, data })], "mirror.json", { type: "application/json" });
  return importBackup(blob);
}

async function maybeBackup(dir: FileSystemDirectoryHandle, force = false): Promise<void> {
  const last = Number(localStorage.getItem(LAST_BACKUP_KEY)) || 0;
  const sameDay = last > 0 && new Date(last).toDateString() === new Date().toDateString();
  if (!force && sameDay && Date.now() - last < BACKUP_EVERY_MS) return;
  if (await storeIsEmpty()) return;
  await writeBackup(dir);
}

/** Back up right now (the "Back up now" button). */
export async function backupNow(): Promise<LinkState> {
  const handle = await loadHandle();
  if (!handle) return getLinkState();
  try {
    if ((await handle.queryPermission?.({ mode: "readwrite" })) !== "granted") return getLinkState();
    await writeSnapshot(handle);
    await maybeBackup(handle, true);
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
  } catch (err) {
    return { ...(await getLinkState()), error: err instanceof Error ? err.message : "Backup failed" };
  }
  return getLinkState();
}

export async function syncNow(): Promise<LinkState> {
  const handle = await loadHandle();
  if (!handle) return getLinkState();
  try {
    if ((await handle.queryPermission?.({ mode: "readwrite" })) !== "granted") return getLinkState();
    if (await storeIsEmpty()) await restoreFromFolder(handle);
    await writeSnapshot(handle);
    await maybeBackup(handle);
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
  } catch (err) {
    return { ...(await getLinkState()), error: err instanceof Error ? err.message : "Sync failed" };
  }
  return getLinkState();
}

/** Must be called from a click: opens the folder picker. */
export async function linkFolder(): Promise<LinkState> {
  const picker = (window as any).showDirectoryPicker as (o?: object) => Promise<DirHandle>;
  const handle = await picker({ id: "made-desk-data", mode: "readwrite" });
  await saveHandle(handle);
  return syncNow();
}

/** Must be called from a click: browsers re-ask for permission after a restart. */
export async function reconnect(): Promise<LinkState> {
  const handle = await loadHandle();
  if (handle) await handle.requestPermission?.({ mode: "readwrite" });
  return syncNow();
}

export async function unlink(): Promise<LinkState> {
  await saveHandle(null);
  localStorage.removeItem(LAST_SYNC_KEY);
  return getLinkState();
}

/** Re-sync shortly after any change in the store. Returns an unsubscribe function. */
export function startAutoSync(onState: (s: LinkState) => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = async () => onState(await syncNow());
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 800);
  };
  window.addEventListener(STORE_EVENT, onChange);
  getLinkState().then((s) => {
    onState(s);
    if (s.linked && s.permission === "granted") run();
  });
  return () => {
    clearTimeout(timer);
    window.removeEventListener(STORE_EVENT, onChange);
  };
}
