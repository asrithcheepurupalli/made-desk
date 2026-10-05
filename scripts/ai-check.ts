/*
 * Checks which AI the desk is using and what it can do.
 *   npx tsx --env-file=.env.local scripts/ai-check.ts
 * Tests: model list (routers), plain text, structured JSON, and reading text from an image.
 */
import fs from "node:fs";
import path from "node:path";
import { aiProvider, modelFor, llm, llmJson, explainAiError } from "../src/lib/ai/llm";

const ok = (b: boolean) => (b ? "PASS" : "FAIL");

(async () => {
  const provider = aiProvider();
  console.log(`provider: ${provider} | fast: ${modelFor("fast")} | smart: ${modelFor("smart")}`);
  if (provider === "none") {
    console.log("No AI configured. Set OPENAI_COMPAT_BASE_URL / OPENAI_COMPAT_API_KEY (router) or ANTHROPIC_API_KEY.");
    process.exit(1);
  }

  if (provider === "compat") {
    try {
      const res = await fetch(process.env.OPENAI_COMPAT_BASE_URL!.replace(/\/+$/, "") + "/models", { headers: { Authorization: `Bearer ${process.env.OPENAI_COMPAT_API_KEY}` } });
      const data: any = await res.json();
      const ids: string[] = (data.data || []).map((m: any) => m.id);
      console.log(`models available: ${ids.length}`);
      console.log(ids.slice(0, 60).join("\n"));
    } catch (e: any) {
      console.log("could not list models:", e.message);
    }
  }

  for (const tier of ["fast", "smart"] as const) {
    const t = Date.now();
    try {
      const j = await llmJson<{ ok: boolean; n: number }>({ tier, prompt: 'Return {"ok": true, "n": 7}', maxTokens: 60 });
      console.log(`${ok(j.ok === true && j.n === 7)} ${tier} text+JSON (${modelFor(tier)}) ${Date.now() - t}ms`);
    } catch (e) {
      console.log(`FAIL ${tier} text+JSON (${modelFor(tier)}): ${explainAiError(e)}`);
    }
  }

  // Vision: read a real screenshot from the repo
  try {
    const img = fs.readFileSync(path.join(process.cwd(), "public/products/airlock.jpg"));
    const t = Date.now();
    const out = await llm({ tier: "fast", maxTokens: 120, images: ["data:image/jpeg;base64," + img.toString("base64")], prompt: "What is the large headline text in this image? Reply with the headline only." });
    console.log(`${ok(/never|client/i.test(out))} image reading ${Date.now() - t}ms -> "${out.trim().slice(0, 80)}"`);
  } catch (e) {
    console.log(`FAIL image reading: ${explainAiError(e)}`);
  }
})();
