"use server";

import { llmJson, aiProvider, explainAiError } from "@/lib/ai/llm";
import type { PlaybookCategory, Region } from "@/lib/data/types";
import type { GeneratedSop } from "../inbox/sop";

export interface ClusterInput {
  sops: Array<{ id: string; title: string; summary: string; category: string; outline: string }>;
  masters: Array<{ id: string; title: string; member_ids: string[] }>;
}

export interface Cluster {
  master_id: string | null;
  topic: string;
  member_ids: string[];
}

export interface MergeInput {
  topic: string;
  members: Array<{ title: string; markdown: string }>;
  base?: { title: string; markdown: string };
}

export interface MergedSop extends GeneratedSop {
  conflicts: string[];
  change_summary: string;
}

const noDash = (s: string) => s.replace(/—/g, ", ").replace(/–/g, "-");

const CLUSTER_PROMPT = `You organise a studio's SOP library. Group SOPs that DUPLICATE or heavily OVERLAP: same job to be done, so a reader would follow essentially the same procedure or use the same scripts.

Rules:
- Merge only when the procedures genuinely overlap. Do NOT merge SOPs just because they share a broad domain (for example cold email and cold calls are different jobs; three SOPs about following up with a prospect who went silent are the same job).
- A short or generic SOP whose whole subject is already covered by a longer, more specific SOP IS an overlap: merge them (for example a general "startup programs" overview and a detailed "how to choose a seed-stage accelerator" SOP cover the same job).
- SOPs about different phases or different deliverables of one broad topic stay SEPARATE (for example: general advice on how to grow a company, versus choosing a program to join, versus the exact wording for filling in that program's application form are three different jobs).
- A group should read as ONE procedure when merged. Prefer 2 to 4 members; if a candidate group needs more than 4, it is probably mixing jobs, so split it.
- Each SOP belongs to at most one group. Only return groups of 2 or more SOPs. Leave unrelated SOPs out.
- You are given existing master pages with their current members. Keep a group attached to its existing master (set master_id) when its members still belong together, including when new SOPs join it. Use null for a brand new group.
- topic: a short, neutral name for the shared job to be done (max 60 chars).

Return ONLY JSON: {"clusters":[{"master_id":"id or null","topic":"","member_ids":["sop id"]}]}`;

export async function clusterSopsAction(input: ClusterInput): Promise<Cluster[] | null> {
  if (input.sops.length < 2) return [];
  if (aiProvider() === "none") return null;
  try {
    const parsed = await llmJson<{ clusters?: Cluster[] }>({
      tier: "smart",
      maxTokens: 4000,
      system: CLUSTER_PROMPT,
      prompt: `EXISTING MASTERS:\n${JSON.stringify(input.masters)}\n\nSOPS:\n${JSON.stringify(input.sops)}`,
    });
    const valid = new Set(input.sops.map((s) => s.id));
    const seen = new Set<string>();
    const out: Cluster[] = [];
    for (const c of parsed.clusters || []) {
      const ids = (c.member_ids || []).filter((id) => valid.has(id) && !seen.has(id));
      if (ids.length < 2) continue;
      ids.forEach((id) => seen.add(id));
      out.push({ master_id: c.master_id || null, topic: noDash(String(c.topic || "Merged SOP")).slice(0, 70), member_ids: ids });
    }
    return out;
  } catch (err) {
    console.warn("[made. desk] SOP clustering failed:", explainAiError(err));
    return null;
  }
}

const MERGE_PROMPT = `You merge overlapping internal SOPs into ONE master SOP for made. by ac, a design and software studio.

GROUNDING RULES (highest priority):
- Use ONLY what appears in the source SOPs (and the current master, if given). Never add advice, steps, tools, numbers, or examples from your own knowledge.
- Deduplicate: when several SOPs say the same thing, say it once, in the clearest and most specific form.
- Keep EVERY distinct script, example message, template, named framework, and number, word for word. Deduplicate only exact or near-identical ones. Never drop a unique one.
- If sources disagree, do not pick silently: keep the most specific version and add a line to "conflicts" saying what differs.
- If a current master is provided, UPDATE it: keep everything still valid, fold in anything new from the sources, and describe exactly what you added or changed in "change_summary" (one or two plain sentences, e.g. "Added the value-first follow-up ladder and 3 new scripts from 'X'"). If there is no current master, change_summary is "Created from N SOPs."

FORMAT:
- "title": short name of the job to be done, max 60 chars, no trailing punctuation.
- "steps": one ordered procedure, 4 to 14 steps, each a short title plus 1 to 4 sentences of concrete detail.
- "scripts": all unique verbatim messages/templates with a label saying when to use each.
- "rules", "checklist" (3 to 10 yes/no checks), "not_covered" (things the sources never specify), "conflicts".
- Speak as our studio ("we"). Never use em dashes or en dashes.

Return ONLY JSON:
{"title":"","category":"acquisition|onboarding|outreach|delivery|pricing|operations","region":"uae|india|us|global","tags":[""],"summary":"","purpose":"","when_to_use":"","steps":[{"title":"","details":""}],"scripts":[{"label":"","text":""}],"rules":[""],"checklist":[""],"not_covered":[""],"conflicts":[""],"change_summary":""}`;

export async function mergeSopsAction(input: MergeInput): Promise<MergedSop | null> {
  if (aiProvider() === "none" || input.members.length < 1) return null;
  try {
    const sources = input.members.map((m, i) => `--- SOURCE SOP ${i + 1}: ${m.title} ---\n${m.markdown}`).join("\n\n");
    const base = input.base ? `CURRENT MASTER (update this):\n# ${input.base.title}\n${input.base.markdown}\n\n` : "";
    const p = await llmJson<MergedSop>({
      tier: "smart",
      maxTokens: 12000,
      timeoutMs: 150000,
      system: MERGE_PROMPT,
      prompt: `TOPIC: ${input.topic}\n\n${base}${sources}`.slice(0, 120000),
    });
    if (!p.title || !Array.isArray(p.steps) || p.steps.length === 0) return null;
    const list = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => noDash(String(x))).filter(Boolean) : []);
    return {
      title: noDash(String(p.title)).slice(0, 70).trim(),
      category: (p.category || "operations") as PlaybookCategory,
      region: (p.region || "global") as Region,
      tags: list(p.tags).slice(0, 6),
      summary: noDash(String(p.summary || "")),
      purpose: noDash(String(p.purpose || "")),
      when_to_use: noDash(String(p.when_to_use || "")),
      steps: p.steps.map((s) => ({ title: noDash(String(s.title || "")), details: noDash(String(s.details || "")) })),
      scripts: Array.isArray(p.scripts)
        ? p.scripts.map((s) => ({ label: noDash(String(s.label || "")), text: String(s.text || "") })).filter((s) => s.text)
        : [],
      rules: list(p.rules),
      checklist: list(p.checklist),
      not_covered: list(p.not_covered),
      conflicts: list(p.conflicts),
      change_summary: noDash(String(p.change_summary || "Updated.")),
    };
  } catch (err) {
    console.warn("[made. desk] SOP merge failed:", explainAiError(err));
    return null;
  }
}
