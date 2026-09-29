import { listPlaybooks } from "@/lib/data/playbooks";
import { listMasters, saveMaster, deleteMaster } from "@/lib/data/masters";
import { playbookToMarkdown, blocksToMarkdown } from "@/lib/data/text";
import { clusterSopsAction, mergeSopsAction, type MergedSop } from "@/app/(dashboard)/masters/ai";
import type { MasterSop, Playbook } from "@/lib/data/types";

/*
 * Keeps the Master SOPs in step with the SOP library. Runs in the browser (the data lives there).
 * Idempotent: it re-groups the library, and only re-merges groups whose member SOPs changed.
 */

export const MASTERS_STATUS_EVENT = "made-desk:masters-status";
const STAMP_KEY = "made-desk:masters-playbook-stamp";
const CONCURRENCY = 3;

export interface MastersStatus {
  running: boolean;
  message: string;
  error?: boolean;
}

let running: Promise<void> | null = null;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit(status: MastersStatus) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(MASTERS_STATUS_EVENT, { detail: status }));
}

const stampOf = (pbs: Playbook[]) =>
  pbs.map((p) => `${p.id}:${p.updated_at}`).sort().join("|");

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

function outline(p: Playbook): string {
  return blocksToMarkdown(p.content)
    .split("\n")
    .filter((l) => /^(#|\d+\.|- \[)/.test(l))
    .join(" | ")
    .slice(0, 700);
}

let seq = 0;
const bid = (k: string) => `m-${k}-${Date.now()}-${seq++}`;

function mergedToBlocks(m: MergedSop, members: Playbook[]): any[] {
  const b: any[] = [{ id: bid("t"), type: "heading_1", text: m.title }];
  b.push({
    id: bid("note"),
    type: "callout",
    text: `Master SOP, auto-merged from ${members.length} overlapping SOPs. It updates itself when similar SOPs are added.`,
  });
  if (m.summary) b.push({ id: bid("s"), type: "paragraph", text: m.summary });
  if (m.purpose) b.push({ id: bid("h"), type: "heading_2", text: "Purpose" }, { id: bid("p"), type: "paragraph", text: m.purpose });
  if (m.when_to_use) b.push({ id: bid("h"), type: "heading_2", text: "When to use" }, { id: bid("p"), type: "paragraph", text: m.when_to_use });
  b.push({ id: bid("h"), type: "heading_2", text: "Procedure" });
  m.steps.forEach((s) => b.push({ id: bid("st"), type: "numbered_list", text: s.details ? `${s.title}: ${s.details}` : s.title }));
  if (m.scripts.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Scripts and examples (verbatim from sources)" });
    m.scripts.forEach((sc) => {
      if (sc.label) b.push({ id: bid("l"), type: "callout", text: sc.label });
      b.push({ id: bid("c"), type: "code_snippet", text: sc.text });
    });
  }
  if (m.rules.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Rules" });
    m.rules.forEach((r) => b.push({ id: bid("r"), type: "bullet_list", text: r }));
  }
  if (m.checklist.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Checklist before we apply this" });
    m.checklist.forEach((c) => b.push({ id: bid("k"), type: "todo", text: c, checked: false }));
  }
  if (m.conflicts.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Where the sources disagree" });
    m.conflicts.forEach((c) => b.push({ id: bid("x"), type: "bullet_list", text: c }));
  }
  if (m.not_covered.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Not covered by the sources" });
    m.not_covered.forEach((g) => b.push({ id: bid("g"), type: "bullet_list", text: g }));
  }
  b.push({ id: bid("h"), type: "heading_2", text: "Merged from" });
  members.forEach((p) => b.push({ id: bid("src"), type: "bullet_list", text: `${p.title} (/playbooks/${p.slug})` }));
  return b;
}

async function pool<T>(items: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

async function runSync(opts: { force?: boolean; onlyMasterId?: string }): Promise<void> {
  const playbooks = await listPlaybooks();
  const masters = await listMasters();
  const alive = new Set(playbooks.map((p) => p.id));
  const stamp = stampOf(playbooks);

  // Drop masters whose every source SOP was deleted
  for (const m of masters) {
    if (!m.source_playbook_ids.some((id) => alive.has(id))) await deleteMaster(m.id);
  }
  const liveMasters = masters.filter((m) => m.source_playbook_ids.some((id) => alive.has(id)));

  if (playbooks.length < 2) return;
  if (!opts.force && typeof localStorage !== "undefined" && localStorage.getItem(STAMP_KEY) === stamp) return;

  emit({ running: true, message: "Grouping overlapping SOPs..." });
  const clusters = await clusterSopsAction({
    sops: playbooks.map((p) => ({ id: p.id, title: p.title, summary: p.summary || "", category: p.category, outline: outline(p) })),
    masters: liveMasters.map((m) => ({ id: m.id, title: m.title, member_ids: m.source_playbook_ids.filter((id) => alive.has(id)) })),
  });
  if (clusters === null) {
    emit({ running: false, message: "Could not group SOPs (AI unavailable). Will retry.", error: true });
    return;
  }

  const byId = new Map(playbooks.map((p) => [p.id, p]));
  const used = new Set<string>();
  const jobs: Array<{ topic: string; members: Playbook[]; target?: MasterSop; memberStamp: string }> = [];

  for (const c of clusters) {
    const members = c.member_ids.map((id) => byId.get(id)!).filter(Boolean);
    // Attach to the existing master the model named, else the one that overlaps most
    let target = c.master_id ? liveMasters.find((m) => m.id === c.master_id && !used.has(m.id)) : undefined;
    if (!target) {
      const scored = liveMasters
        .filter((m) => !used.has(m.id))
        .map((m) => ({ m, n: m.source_playbook_ids.filter((id) => c.member_ids.includes(id)).length }))
        .sort((a, b) => b.n - a.n)[0];
      if (scored && scored.n / Math.max(1, Math.min(members.length, scored.m.source_playbook_ids.length)) >= 0.5) target = scored.m;
    }
    if (target) used.add(target.id);
    const memberStamp = stampOf(members);
    if (opts.onlyMasterId && target?.id !== opts.onlyMasterId) continue;
    if (!opts.force && target && target.source_stamp === memberStamp) continue;
    jobs.push({ topic: c.topic, members, target, memberStamp });
  }

  let done = 0;
  let failed = 0;
  await pool(jobs, CONCURRENCY, async (job) => {
    emit({ running: true, message: `Merging SOPs (${done + 1} of ${jobs.length}): ${job.topic}` });
    const merged = await mergeSopsAction({
      topic: job.topic,
      members: job.members.map((p) => ({ title: p.title, markdown: playbookToMarkdown(p) })),
      base: job.target ? { title: job.target.title, markdown: blocksToMarkdown(job.target.content) } : undefined,
    });
    done++;
    if (!merged) {
      failed++;
      return;
    }
    const now = new Date().toISOString();
    const t = job.target;
    await saveMaster({
      id: t?.id || crypto.randomUUID(),
      slug: t?.slug || `${slugify(merged.title) || "master"}-${Date.now().toString().slice(-4)}`,
      title: merged.title,
      summary: merged.summary,
      category: merged.category,
      region: merged.region,
      tags: merged.tags,
      content: mergedToBlocks(merged, job.members),
      source_playbook_ids: job.members.map((p) => p.id),
      source_stamp: job.memberStamp,
      version: (t?.version || 0) + 1,
      changelog: [{ at: now, summary: merged.change_summary }, ...(t?.changelog || [])].slice(0, 30),
      merged_at: now,
      created_at: t?.created_at || now,
      updated_at: now,
    });
  });

  if (failed === 0 && typeof localStorage !== "undefined") localStorage.setItem(STAMP_KEY, stamp);
  emit({
    running: false,
    message: failed ? `${failed} merge(s) failed. Will retry.` : jobs.length ? `Master SOPs up to date (${jobs.length} updated).` : "Master SOPs up to date.",
    error: failed > 0,
  });
}

export function syncMasters(opts: { force?: boolean; onlyMasterId?: string } = {}): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }
  running = (async () => {
    try {
      await runSync(opts);
      while (rerun) {
        rerun = false;
        await runSync({});
      }
    } catch (err) {
      console.error("[made. desk] Master sync failed:", err);
      emit({ running: false, message: "Master sync failed. Will retry.", error: true });
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Debounced trigger. Safe to call often, and a no-op outside the browser. */
export function scheduleMasterSync(delay = 4000) {
  if (typeof window === "undefined") return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncMasters(), delay);
}
