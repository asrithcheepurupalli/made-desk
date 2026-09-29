import fs from "node:fs/promises";
import path from "node:path";

/*
 * Storage for made. desk.
 *
 * In the browser (the real app) everything lives in IndexedDB, so data survives
 * refreshes and deploys and never leaves the device. On the server (only used by
 * the local CLI scripts) it falls back to .data/*.json files.
 */

const isBrowser = typeof window !== "undefined" && typeof indexedDB !== "undefined";

export const STORE_EVENT = "made-desk:store";
export const STORE_FILES = [
  "captures.json",
  "playbooks.json",
  "clients.json",
  "actions.json",
  "assistant_messages.json",
];

const memoryStore = new Map<string, any>();

/* ---------------- Browser: IndexedDB ---------------- */

const DB_NAME = "made-desk";
const STORE_NAME = "kv";
let dbPromise: Promise<IDBDatabase> | null = null;
let channel: BroadcastChannel | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function getChannel(): BroadcastChannel | null {
  if (!isBrowser || typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel("made-desk-store");
    // Another tab wrote: drop our cache so the next read hits IndexedDB, then notify the UI.
    channel.onmessage = (e) => {
      const file = e.data?.file as string | undefined;
      if (file) memoryStore.delete(file);
      else memoryStore.clear();
      window.dispatchEvent(new Event(STORE_EVENT));
    };
  }
  return channel;
}

function announce(file: string) {
  window.dispatchEvent(new Event(STORE_EVENT));
  getChannel()?.postMessage({ file });
}

/* ---------------- Server: local .data files (CLI only) ---------------- */

async function getWritableDir(): Promise<string> {
  const primaryDir = path.join(process.cwd(), ".data");
  try {
    await fs.mkdir(primaryDir, { recursive: true });
    return primaryDir;
  } catch {
    const fallbackDir = path.join("/tmp", "made-desk-data");
    await fs.mkdir(fallbackDir, { recursive: true }).catch(() => {});
    return fallbackDir;
  }
}

/* ---------------- Public API ---------------- */

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (memoryStore.has(filename)) return memoryStore.get(filename) as T;

  if (isBrowser) {
    getChannel();
    try {
      const stored = await idbGet<T>(filename);
      if (stored !== undefined) {
        memoryStore.set(filename, stored);
        return stored;
      }
    } catch (err) {
      console.warn("[made. desk] IndexedDB read failed:", err);
    }
    memoryStore.set(filename, fallback);
    return fallback;
  }

  try {
    const dir = await getWritableDir();
    const raw = await fs.readFile(path.join(dir, filename), "utf-8");
    const parsed = JSON.parse(raw) as T;
    memoryStore.set(filename, parsed);
    return parsed;
  } catch {}

  memoryStore.set(filename, fallback);
  return fallback;
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  memoryStore.set(filename, data);

  if (isBrowser) {
    try {
      await idbPut(filename, data);
    } catch (err) {
      // Surface it: silently losing a write is the exact bug we are avoiding.
      memoryStore.delete(filename);
      throw new Error(
        `Could not save to browser storage (${err instanceof Error ? err.message : "unknown error"}). Storage may be full or blocked.`
      );
    }
    announce(filename);
    return;
  }

  try {
    const dir = await getWritableDir();
    await fs.writeFile(path.join(dir, filename), JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[made. desk filestore] Could not write ${filename}:`, err);
  }
}
