"use client";

import type { OutreachActions, OutreachSnapshot } from "./types";

/*
 * The outreach sender runs on the studio Mac and keeps its state in
 * ~/made-crew-outreach/out. The board reads that folder straight from disk with the
 * File System Access API (Chrome / Edge / Arc / Brave), the same way "Link Claude" works.
 * Nothing is uploaded: contact details never leave the machine.
 */

const HANDLE_DB = "made-desk-outreach-handle";
const HANDLE_STORE = "h";
const HANDLE_KEY = "dir";
const SNAPSHOT_FILE = "desk-outreach.json";
const ACTIONS_FILE = "desk-actions.json";

type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
};

export type FolderState =
  | { kind: "unsupported" }
  | { kind: "unlinked" }
  | { kind: "locked"; folder: string } // linked, but the browser wants one click again
  | { kind: "empty"; folder: string } // linked, no snapshot file in it yet
  | { kind: "ready"; folder: string; snapshot: OutreachSnapshot; actions: OutreachActions };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadHandle(): Promise<DirHandle | null> {
  try {
    const db = await openDb();
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
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    if (handle) tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
    else tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readJson<T>(dir: DirHandle, name: string): Promise<T | null> {
  try {
    const file = await (await dir.getFileHandle(name)).getFile();
    return JSON.parse(await file.text()) as T;
  } catch {
    return null; // missing, or caught mid-write: the next refresh picks it up
  }
}

export function folderLinkSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Reads the current state of the linked folder. Safe to call on a timer. */
export async function readFolder(): Promise<FolderState> {
  if (!folderLinkSupported()) return { kind: "unsupported" };
  const dir = await loadHandle();
  if (!dir) return { kind: "unlinked" };
  let permission: PermissionState = "prompt";
  try {
    permission = (await dir.queryPermission?.({ mode: "readwrite" })) || "prompt";
  } catch {}
  if (permission !== "granted") return { kind: "locked", folder: dir.name };
  const snapshot = await readJson<OutreachSnapshot>(dir, SNAPSHOT_FILE);
  if (!snapshot) return { kind: "empty", folder: dir.name };
  const actions = (await readJson<OutreachActions>(dir, ACTIONS_FILE)) || {};
  return { kind: "ready", folder: dir.name, snapshot, actions };
}

/** Must be called from a click: opens the folder picker. */
export async function linkFolder(): Promise<FolderState> {
  const picker = (window as unknown as { showDirectoryPicker: (o?: object) => Promise<DirHandle> }).showDirectoryPicker;
  const handle = await picker({ id: "made-outreach-out", mode: "readwrite" });
  await saveHandle(handle);
  return readFolder();
}

/** Must be called from a click: browsers re-ask for permission after a restart. */
export async function reconnectFolder(): Promise<FolderState> {
  const dir = await loadHandle();
  if (dir) await dir.requestPermission?.({ mode: "readwrite" });
  return readFolder();
}

export async function unlinkFolder(): Promise<FolderState> {
  await saveHandle(null);
  return readFolder();
}

/** Merge one person's marks into desk-actions.json. The sender reads it on its next run. */
export async function saveAction(email: string, patch: OutreachActions[string]): Promise<OutreachActions> {
  const dir = await loadHandle();
  if (!dir) throw new Error("The outreach folder is not linked.");
  const all = (await readJson<OutreachActions>(dir, ACTIONS_FILE)) || {};
  all[email] = { ...all[email], ...patch };
  const file = await dir.getFileHandle(ACTIONS_FILE, { create: true });
  const w = await file.createWritable();
  await w.write(JSON.stringify(all, null, 1));
  await w.close();
  return all;
}
