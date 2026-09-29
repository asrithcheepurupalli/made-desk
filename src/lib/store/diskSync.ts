"use client";

import { readJsonFile, STORE_EVENT, STORE_FILES } from "@/lib/supabase/filestore";

/*
 * Mirrors the browser store into a real folder (pick ~/made-desk/.data once) so Claude Code,
 * the desk CLI and the MCP server can read every SOP. The browser stays the source of truth.
 * Uses the File System Access API (Chrome / Edge / Arc / Brave).
 */

const HANDLE_DB = "made-desk-handle";
const HANDLE_STORE = "h";
const HANDLE_KEY = "dir";
const LAST_SYNC_KEY = "made-desk:last-disk-sync";

export type LinkState = {
  supported: boolean;
  linked: boolean;
  permission: "granted" | "prompt" | "denied" | "none";
  lastSync?: number;
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
  if (!handle) return { supported: true, linked: false, permission: "none" };
  let permission: LinkState["permission"] = "prompt";
  try {
    permission = ((await handle.queryPermission?.({ mode: "readwrite" })) as LinkState["permission"]) || "prompt";
  } catch {}
  return { supported: true, linked: true, permission, lastSync: last, folder: handle.name };
}

/** Write every store file into the folder. Screenshots are dropped: Claude only needs the text. */
export async function writeSnapshot(dir: FileSystemDirectoryHandle): Promise<void> {
  for (const name of STORE_FILES) {
    let rows = await readJsonFile<any[]>(name, []);
    if (name === "captures.json") rows = rows.map((r) => ({ ...r, screenshots: undefined }));
    const file = await dir.getFileHandle(name, { create: true });
    const w = await file.createWritable();
    await w.write(JSON.stringify(rows, null, 2));
    await w.close();
  }
}

export async function syncNow(): Promise<LinkState> {
  const handle = await loadHandle();
  if (!handle) return getLinkState();
  try {
    if ((await handle.queryPermission?.({ mode: "readwrite" })) !== "granted") return getLinkState();
    await writeSnapshot(handle);
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
