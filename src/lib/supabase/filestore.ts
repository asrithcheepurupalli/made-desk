import fs from "node:fs/promises";
import path from "node:path";

// Memory cache to ensure instant reads and cross-request persistence within instance
const memoryStore = new Map<string, any>();

async function getWritableDir(): Promise<string> {
  const primaryDir = path.join(process.cwd(), ".data");
  try {
    await fs.mkdir(primaryDir, { recursive: true });
    // Test write permission
    const testFile = path.join(primaryDir, ".test-write");
    await fs.writeFile(testFile, "ok", "utf-8");
    await fs.unlink(testFile).catch(() => {});
    return primaryDir;
  } catch {
    // Read-only filesystem (e.g. AWS Lambda / Vercel serverless)
    const fallbackDir = path.join("/tmp", "made-desk-data");
    try {
      await fs.mkdir(fallbackDir, { recursive: true });
    } catch {}
    return fallbackDir;
  }
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (memoryStore.has(filename)) {
    return memoryStore.get(filename) as T;
  }

  // 1. Try writable dir first (including /tmp if on Vercel)
  const writableDir = await getWritableDir();
  const writablePath = path.join(writableDir, filename);

  try {
    const raw = await fs.readFile(writablePath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    memoryStore.set(filename, parsed);
    return parsed;
  } catch {}

  // 2. If not found in writableDir, try reading from project root .data
  const projectPath = path.join(process.cwd(), ".data", filename);
  try {
    const raw = await fs.readFile(projectPath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    memoryStore.set(filename, parsed);
    return parsed;
  } catch {}

  memoryStore.set(filename, fallback);
  return fallback;
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  // Update memory immediately
  memoryStore.set(filename, data);

  const writableDir = await getWritableDir();
  const filePath = path.join(writableDir, filename);

  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[made. desk filestore] Could not write to ${filePath}, stored in-memory:`, err);
  }
}
