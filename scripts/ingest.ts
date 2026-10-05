/*
 * Batch-ingest Instagram links on this Mac (full pipeline: Whisper speech + OCR on-screen text + AI),
 * then write ONE importable backup file. Import it with the app's sidebar Import button (it merges).
 *   npx tsx --env-file=.env.local scripts/ingest.ts <url> [<url> ...]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { extractMediaFromUrl } from "../src/lib/media/extractor";
import { extractInsightsWithGemini } from "../src/lib/ai/gemini";
import { generateSopAction } from "../src/app/(dashboard)/inbox/sop";
import { buildSopBlocks, buildBasicBlocks } from "../src/lib/data/sopBlocks";
import { explainAiError } from "../src/lib/ai/llm";

const urls = process.argv.slice(2);
const OUT = path.join(os.homedir(), "Desktop", "made-desk-ingest.json");
const shortcode = (u: string) => u.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[1] || u;
const readJson = (f: string): any[] => { try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), ".data", f), "utf-8")); } catch { return []; } };

const existingCaps = readJson("captures.json");
const have = new Set(existingCaps.map((c) => shortcode(c.source_url || "")));
const openTitles: string[] = readJson("actions.json").filter((a) => a.status !== "done").map((a) => a.title);
const tok = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2));
const similar = (a: string, b: string) => { const x = tok(a), y = tok(b); return [...x].filter((w) => y.has(w)).length / Math.max(1, Math.min(x.size, y.size)) >= 0.7; };

const out = { captures: [] as any[], playbooks: [] as any[], actions: [] as any[] };
const report: string[] = [];
const save = () => fs.writeFileSync(OUT, JSON.stringify({ app: "made-desk", version: 1, exported_at: new Date().toISOString(), data: { "captures.json": out.captures, "playbooks.json": out.playbooks, "actions.json": out.actions } }));

(async () => {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const code = shortcode(url);
    const tag = `[${i + 1}/${urls.length}] ${code}`;
    if (have.has(code)) { console.log(`${tag} SKIP already captured`); report.push(`${tag}: skipped, already in the desk`); continue; }
    const t0 = Date.now();
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const m = await extractMediaFromUrl(url, "ingest-" + code);
      const base: any = { id, raw_text: m.transcript || `[Auto Ingestion for ${url}]`, source_url: url, source_type: "reel", status: "processed", created_at: now, updated_at: now, processed_at: now, screenshots: m.screenshots.length ? m.screenshots : undefined, duration_seconds: m.durationSeconds, source_quality: m.quality === "none" ? "caption_only" : m.quality };
      if (m.quality === "none" && !m.transcript.trim()) {
        out.captures.push({ ...base, status: "failed", extracted_insights: [], quality_note: m.note || "Nothing could be read from this link." });
        console.log(`${tag} FAILED nothing readable: ${m.note}`); report.push(`${tag}: nothing readable (${m.note || "blocked"})`); save(); continue;
      }
      const ex = await extractInsightsWithGemini(m.transcript, url, m.quality === "none" ? "caption_only" : m.quality);
      const cap = { ...base, summary: ex.summary, extracted_insights: ex.extracted_insights, suggested_category: ex.suggested_category, quality_note: m.quality === "caption_only" ? m.note : undefined };
      out.captures.push(cap);
      for (const act of (ex.proposed_actions || []).slice(0, 2)) {
        if (openTitles.some((t) => similar(t, act.title))) continue;
        openTitles.push(act.title);
        out.actions.push({ id: crypto.randomUUID(), title: act.title, description: act.description, priority: act.priority || "medium", status: "todo", source_capture_id: id, created_at: now, updated_at: now });
      }
      let line = `${tag} ${m.quality} | spoken ${m.spoken.length} ocr ${m.onScreenText.length} | `;
      if (m.quality === "caption_only") {
        line += "NO SOP (caption only)";
        report.push(`${tag}: caption only, no SOP (${m.note || "video not readable"}). Caption: ${m.caption.slice(0, 90).replace(/\n/g, " ")}`);
      } else {
        const sop = await generateSopAction({ transcript: m.transcript, summary: ex.summary, sourceUrl: url });
        const title = sop?.title || ex.summary.split(/(?<=[.!?])\s/)[0].slice(0, 60);
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "sop"}-${Date.now().toString().slice(-4)}`;
        const category = sop?.category || "acquisition";
        const slim = { ...cap, screenshots: (cap.screenshots || []).slice(0, 3) };
        out.playbooks.push({ id: crypto.randomUUID(), slug, title, category, region: sop?.region || "global", tags: sop?.tags?.length ? sop.tags : ["capture-derived", "sop", category], summary: sop?.summary || ex.summary, content: sop ? buildSopBlocks(sop, slim) : buildBasicBlocks(title, slim), source_capture_ids: [id], created_at: now, updated_at: now });
        line += `SOP "${title}" (${sop ? sop.steps.length + " steps, " + sop.scripts.length + " scripts" : "basic layout, AI SOP failed"})`;
        report.push(`${tag}: SOP "${title}"`);
      }
      console.log(`${line} | ${Math.round((Date.now() - t0) / 1000)}s`);
    } catch (e) {
      console.log(`${tag} ERROR ${explainAiError(e)}`); report.push(`${tag}: error, ${explainAiError(e)}`);
    }
    save();
  }
  console.log(`\nDONE. ${out.captures.length} captures, ${out.playbooks.length} SOPs, ${out.actions.length} tasks -> ${OUT}`);
  fs.writeFileSync("/tmp/hall/ingest-report.txt", report.join("\n"));
})();
