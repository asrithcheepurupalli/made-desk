"use server";

import { GoogleGenAI } from "@google/genai";

export interface TriageTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  source: string; // short note on where the task came from
}

export interface TriageDecision {
  id: string;
  decision: "keep" | "remove";
  reason: string;
}

const PROMPT = `You clean up a studio's task list. Every task below was auto-generated from a saved video or article, and the studio ALREADY keeps a full SOP for each of those, so most of these tasks just restate an SOP or are generic filler.

KEEP a task only if it is specific and would change something real: it names a concrete object, system, client, or deliverable AND has a checkable outcome (for example "Verify Supabase Row Level Security is enabled on every table"). Security, cost, and compliance checks with a named target are usually worth keeping.

REMOVE a task if any of these is true:
- Generic process filler: train or brief a team, review current templates/scripts/strategies, integrate into a workflow or CRM, develop or draft templates, document something, research more, assess relevance, "implement the new X" with no named target.
- It restates a step or checklist item of an SOP (the SOP is the place for it).
- It is a near-duplicate of another task. Keep only the single most specific one and remove the rest.
- It says to watch a reel and paste key points, UNLESS its source note says the capture is caption_only.

Be decisive. A good result keeps roughly a quarter to a third of generic auto-generated lists. Give a short reason (max 12 words) for every task.

Return ONLY JSON: {"decisions":[{"id":"","decision":"keep|remove","reason":""}]}`;

const GENERIC = /^(train|brief|educate|review (our |the )?(current|existing)?|integrate|develop .*(template|library|guide)|draft .*template|document|research|assess|standardi[sz]e|update our)\b/i;

/** Rule-based fallback when the AI is unavailable: only obvious filler and duplicates. */
function ruleBased(tasks: TriageTask[]): TriageDecision[] {
  const seen = new Set<string>();
  return tasks.map((t) => {
    const key = t.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (seen.has(key)) return { id: t.id, decision: "remove", reason: "Duplicate title" };
    seen.add(key);
    if (GENERIC.test(t.title.trim()) && !/caption_only/.test(t.source)) return { id: t.id, decision: "remove", reason: "Generic filler (rule-based)" };
    return { id: t.id, decision: "keep", reason: "Specific enough" };
  });
}

export async function triageTasksAction(input: { tasks: TriageTask[]; sopTitles: string[] }): Promise<{ decisions: TriageDecision[]; usedAi: boolean }> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || input.tasks.length === 0) return { decisions: ruleBased(input.tasks), usedAi: false };
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { text: `SOPS THE STUDIO ALREADY HAS:\n${input.sopTitles.map((t) => "- " + t).join("\n")}\n\nTASKS:\n${JSON.stringify(input.tasks)}` },
          ],
        },
      ],
      config: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingBudget: 2048 } },
    });
    const parsed = JSON.parse((res.text || "").trim()) as { decisions?: TriageDecision[] };
    const byId = new Map((parsed.decisions || []).map((d) => [d.id, d]));
    // Anything the model skipped is kept: never delete on silence
    const decisions = input.tasks.map((t): TriageDecision => {
      const d = byId.get(t.id);
      return d && (d.decision === "remove" || d.decision === "keep")
        ? { id: t.id, decision: d.decision, reason: String(d.reason || "").replace(/—|–/g, "-").slice(0, 120) }
        : { id: t.id, decision: "keep", reason: "Not reviewed" };
    });
    return { decisions, usedAi: true };
  } catch (err) {
    console.warn("[made. desk] Task triage failed, using rules:", err);
    return { decisions: ruleBased(input.tasks), usedAi: false };
  }
}
