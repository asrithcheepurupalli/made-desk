import { supabaseAdmin } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { SEED_ACTIONS } from "./seeds";
import type { NextAction } from "./types";

const FILENAME = "actions.json";

export async function listNextActions(): Promise<NextAction[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("next_actions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) return data as NextAction[];
  }

  const items = await readJsonFile<NextAction[]>(FILENAME, SEED_ACTIONS);
  if (items.length === 0) {
    await writeJsonFile(FILENAME, SEED_ACTIONS);
    return SEED_ACTIONS;
  }
  return items;
}

export async function getNextAction(id: string): Promise<NextAction | null> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("next_actions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return data as NextAction;
  }

  const items = await listNextActions();
  return items.find((a) => a.id === id) ?? null;
}

export async function createNextAction(
  input: Omit<NextAction, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<NextAction> {
  const now = new Date().toISOString();
  const action: NextAction = {
    id: input.id || crypto.randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status || "todo",
    priority: input.priority || "medium",
    source_capture_id: input.source_capture_id,
    linked_playbook_id: input.linked_playbook_id,
    linked_client_id: input.linked_client_id,
    due_date: input.due_date,
    created_at: now,
    updated_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("next_actions").insert([action]);
  } else {
    const items = await listNextActions();
    items.unshift(action);
    await writeJsonFile(FILENAME, items);
  }

  return action;
}

export async function updateNextAction(
  id: string,
  patch: Partial<NextAction>
): Promise<NextAction | null> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("next_actions")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (!error && data) return data as NextAction;
  }

  const items = await listNextActions();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updated_at: now };
  await writeJsonFile(FILENAME, items);
  return items[idx];
}

export async function deleteNextAction(id: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("next_actions").delete().eq("id", id);
    return !error;
  }
  const items = await listNextActions();
  const filtered = items.filter((a) => a.id !== id);
  await writeJsonFile(FILENAME, filtered);
  return true;
}
