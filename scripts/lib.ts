import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

/** When was the browser last mirrored to disk? Claude reads this copy, so staleness matters. */
export function freshnessHeader(): string {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    if (!files.length) throw new Error("empty");
    const newest = Math.max(...files.map((f) => fs.statSync(path.join(DATA_DIR, f)).mtimeMs));
    const mins = Math.round((Date.now() - newest) / 60000);
    const ago = mins < 1 ? "just now" : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} days ago`;
    return `Snapshot of the app's data, last synced ${ago} (${new Date(newest).toLocaleString()}). If you edited in the app since then, it may be missing here.`;
  } catch {
    return "No synced data found in .data/. In the app, click 'Link Claude' in the sidebar (or Export, then run: desk import <file>).";
  }
}

export const WRITE_WARNING =
  "Note: the app's browser storage is the source of truth. Changes made here are overwritten on the next sync from the app.";
