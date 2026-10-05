import fs from "node:fs";
import { llm, llmJson } from "./src/lib/ai/llm";
import { generateSopAction } from "./src/app/(dashboard)/inbox/sop";
import { extractInsightsWithGemini } from "./src/lib/ai/gemini";

const spoken = fs.readFileSync("/tmp/hall/v/ob/a.txt", "utf8");
const ocr = fs.readFileSync("/tmp/hall/v/ocr_all.txt", "utf8").split("\n").filter((l) => /[A-Za-z]{4,}/.test(l)).join("\n");
const transcript = `CAPTION:\nHow to get anyone's attention with cold outreach #sales #leadgeneration #coldemail\n\nSPOKEN TRANSCRIPT:\n${spoken}\n\nON-SCREEN TEXT (read by OCR, so some lines may be garbled: ignore garbage, never guess what it meant):\n${ocr}`;
const models = (process.argv[2] || "").split(",").filter(Boolean);
const img = "data:image/jpeg;base64," + fs.readFileSync("public/products/airlock.jpg").toString("base64");

(async () => {
  for (const m of models) {
    process.env.OPENAI_COMPAT_MODEL_FAST = m; process.env.OPENAI_COMPAT_MODEL_SMART = m;
    console.log(`\n=== ${m}`);
    let t = Date.now();
    try { const j = await llmJson<{ ok: boolean; n: number }>({ tier: "fast", prompt: 'Return {"ok": true, "n": 7}', maxTokens: 400 }); console.log(` JSON basic: ${j.ok && j.n === 7 ? "PASS" : "FAIL"} ${Date.now() - t}ms`); } catch (e: any) { console.log(" JSON basic: FAIL", e.message?.slice(0, 100)); continue; }
    t = Date.now();
    try { const x = await extractInsightsWithGemini(transcript, "https://x", "full"); console.log(` extraction: ${Date.now() - t}ms | insights ${x.extracted_insights.length} | actions ${x.proposed_actions.length} | summary: ${x.summary.slice(0, 110)}`); } catch (e: any) { console.log(" extraction FAIL:", e.message?.slice(0, 120)); }
    t = Date.now();
    const sop = await generateSopAction({ transcript, sourceUrl: "https://x" });
    console.log(sop ? ` SOP: ${Date.now() - t}ms | "${sop.title}" | steps ${sop.steps.length} | scripts ${sop.scripts.length} | rules ${sop.rules.length} | checklist ${sop.checklist.length} | gaps ${sop.not_covered.length}` : ` SOP: FAIL (${Date.now() - t}ms)`);
    if (sop) console.log("  step1:", sop.steps[0]?.title, "|", sop.steps[0]?.details.slice(0, 100)); 
    t = Date.now();
    try { const v = await llm({ tier: "fast", maxTokens: 600, images: [img], prompt: "What is the large headline text in this image? Reply with the headline only." }); console.log(` vision: ${/never|client/i.test(v) ? "PASS" : "?"} ${Date.now() - t}ms -> ${v.trim().slice(0, 70)}`); } catch (e: any) { console.log(" vision: no", e.message?.slice(0, 70)); }
  }
})();
