import { listNextActions, deleteNextActions, replaceNextActions } from "@/lib/data/actions";
import { listCaptures } from "@/lib/data/captures";
import { listPlaybooks } from "@/lib/data/playbooks";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { triageTasksAction, type TriageDecision } from "@/app/(dashboard)/actions/triage";
import type { NextAction } from "@/lib/data/types";

const BACKUP_FILE = "actions.backup.json";

export interface CleanupPreview {
  removals: Array<{ task: NextAction; reason: string }>;
  kept: number;
  protectedCount: number;
  usedAi: boolean;
}

export interface CleanupBackup {
  at: string;
  removed: number;
  actions: NextAction[];
}

/** Manual, in-progress, or client-linked tasks are never touched. */
const isProtected = (a: NextAction) => !a.source_capture_id || Boolean(a.linked_client_id) || a.status === "in_progress" || a.status === "done";

export async function previewCleanup(): Promise<CleanupPreview> {
  const [actions, captures, playbooks] = await Promise.all([listNextActions(), listCaptures(), listPlaybooks()]);
  const capById = new Map(captures.map((c) => [c.id, c]));
  const candidates = actions.filter((a) => !isProtected(a));

  const { decisions, usedAi } = await triageTasksAction({
    sopTitles: playbooks.map((p) => p.title),
    tasks: candidates.map((a) => {
      const c = a.source_capture_id ? capById.get(a.source_capture_id) : undefined;
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        priority: a.priority,
        source: c ? `${c.source_quality || "unknown"} capture: ${(c.summary || "").slice(0, 100)}` : "capture deleted",
      };
    }),
  });

  const dec = new Map<string, TriageDecision>(decisions.map((d) => [d.id, d]));
  const removals = candidates
    .filter((a) => dec.get(a.id)?.decision === "remove")
    .map((a) => ({ task: a, reason: dec.get(a.id)!.reason }));
  return { removals, kept: actions.length - removals.length, protectedCount: actions.length - candidates.length, usedAi };
}

export async function applyCleanup(ids: string[]): Promise<number> {
  const before = await listNextActions();
  const backup: CleanupBackup = { at: new Date().toISOString(), removed: ids.length, actions: before };
  await writeJsonFile(BACKUP_FILE, backup);
  return deleteNextActions(ids);
}

export async function getCleanupBackup(): Promise<CleanupBackup | null> {
  const b = await readJsonFile<CleanupBackup | null>(BACKUP_FILE, null);
  return b && Array.isArray(b.actions) ? b : null;
}

export async function undoCleanup(): Promise<number> {
  const b = await getCleanupBackup();
  if (!b) return 0;
  await replaceNextActions(b.actions);
  await writeJsonFile(BACKUP_FILE, null);
  return b.removed;
}
