"use server";

import { llmJson, aiProvider, explainAiError } from "@/lib/ai/llm";
import type { PlaybookCategory, Region } from "@/lib/data/types";

export interface GeneratedSop {
  title: string;
  category: PlaybookCategory;
  region: Region;
  tags: string[];
  summary: string;
  purpose: string;
  when_to_use: string;
  steps: Array<{ title: string; details: string }>;
  scripts: Array<{ label: string; text: string }>;
  rules: string[];
  checklist: string[];
  not_covered: string[];
}

const SOP_PROMPT = `You write internal SOPs for made. by ac, a design and software studio.
You are given the FULL source material from a video or post (caption, spoken transcript, on-screen text). Turn it into a precise, executable SOP.

GROUNDING RULES (highest priority):
- Use ONLY what the source says. Never add advice, steps, tools, numbers, or examples from your own knowledge.
- Keep the creator's exact numbers, named frameworks, and example lines. Put every quotable message or template into "scripts" word for word.
- If the source skips something a reader would need (who does it, timing, tools, metrics), list it in "not_covered" instead of inventing it.

COMPLETENESS RULES:
- Be exhaustive. Every framework, ladder, list, named method, number, and example line in the source, whether spoken OR shown as on-screen text, must appear in "steps", "scripts", or "rules". Do not compress specifics into vague advice.
- On-screen text is often the tightest version of the material (slides, bad vs better examples, message ladders). Mine it as carefully as the speech.
- Every example message, template, or sample line goes into "scripts" word for word, one entry each, with a label saying what it is and when it is used.
- Where the source shows a sequence (message 1, message 2, message 3), reproduce the whole sequence as a step or scripts.

FORMAT RULES:
- "title": short imperative or noun phrase, max 60 characters, no trailing punctuation, never a sentence about "this content".
- "steps": ordered procedure, each step a short title plus 1 to 4 sentences of concrete detail from the source. 4 to 12 steps.
- "rules": hard dos and don'ts stated in the source.
- "checklist": 3 to 8 yes/no checks someone runs before applying the SOP.
- "purpose": one sentence, the outcome this SOP produces. "when_to_use": one sentence trigger.
- Speak as our studio ("we", "our team"). Never use em dashes or en dashes; use commas, colons, or periods.

Return ONLY JSON:
{"title":"","category":"acquisition|onboarding|outreach|delivery|pricing|operations","region":"uae|india|us|global","tags":[""],"summary":"","purpose":"","when_to_use":"","steps":[{"title":"","details":""}],"scripts":[{"label":"","text":""}],"rules":[""],"checklist":[""],"not_covered":[""]}`;

const noDash = (s: string) => s.replace(/—/g, ", ").replace(/–/g, "-");

export async function generateSopAction(input: {
  transcript: string;
  summary?: string;
  sourceUrl?: string;
}): Promise<GeneratedSop | null> {
  if (aiProvider() === "none" || !input.transcript.trim()) return null;

  try {
    const parsed = await llmJson<GeneratedSop>({
      tier: "smart",
      maxTokens: 8000,
      system: SOP_PROMPT,
      prompt: `SOURCE URL: ${input.sourceUrl || "none"}\n\nSOURCE MATERIAL:\n"""\n${input.transcript.slice(0, 60000)}\n"""`,
    });
    if (!parsed.title || !Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;

    const list = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => noDash(String(x))).filter(Boolean) : []);
    return {
      title: noDash(String(parsed.title)).slice(0, 70).trim(),
      category: parsed.category || "operations",
      region: parsed.region || "global",
      tags: list(parsed.tags).slice(0, 6),
      summary: noDash(String(parsed.summary || "")),
      purpose: noDash(String(parsed.purpose || "")),
      when_to_use: noDash(String(parsed.when_to_use || "")),
      steps: parsed.steps.map((s) => ({ title: noDash(String(s.title || "")), details: noDash(String(s.details || "")) })),
      scripts: Array.isArray(parsed.scripts)
        ? parsed.scripts.map((s) => ({ label: noDash(String(s.label || "")), text: String(s.text || "") })).filter((s) => s.text)
        : [],
      rules: list(parsed.rules),
      checklist: list(parsed.checklist),
      not_covered: list(parsed.not_covered),
    };
  } catch (err) {
    console.warn("[made. desk] SOP generation failed:", explainAiError(err));
    return null;
  }
}
