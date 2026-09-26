import { supabaseAdmin } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { SEED_PLAYBOOKS } from "./seeds";
import type { Playbook } from "./types";

const FILENAME = "playbooks.json";

export async function listPlaybooks(): Promise<Playbook[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data as Playbook[];
  }

  const items = await readJsonFile<Playbook[]>(FILENAME, []);
  return items;
}

export async function getPlaybookBySlug(slug: string): Promise<Playbook | null> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return data as Playbook;
  }

  const items = await listPlaybooks();
  return items.find((p) => p.slug === slug) ?? null;
}

export async function createPlaybook(
  input: Omit<Playbook, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<Playbook> {
  const now = new Date().toISOString();
  const playbook: Playbook = {
    id: input.id || crypto.randomUUID(),
    slug: input.slug,
    title: input.title,
    category: input.category || "acquisition",
    region: input.region || "global",
    tags: input.tags || [],
    content: input.content || [],
    summary: input.summary,
    source_capture_ids: input.source_capture_ids || [],
    created_at: now,
    updated_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("playbooks").insert([playbook]);
  } else {
    const items = await listPlaybooks();
    items.unshift(playbook);
    await writeJsonFile(FILENAME, items);
  }

  return playbook;
}

export async function updatePlaybook(
  slug: string,
  patch: Partial<Playbook>
): Promise<Playbook | null> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .update({ ...patch, updated_at: now })
      .eq("slug", slug)
      .select()
      .maybeSingle();
    if (!error && data) return data as Playbook;
  }

  const items = await listPlaybooks();
  const idx = items.findIndex((p) => p.slug === slug);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updated_at: now };
  await writeJsonFile(FILENAME, items);
  return items[idx];
}

export async function deletePlaybook(slug: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("playbooks").delete().eq("slug", slug);
    return !error;
  }
  const items = await listPlaybooks();
  const filtered = items.filter((p) => p.slug !== slug);
  await writeJsonFile(FILENAME, filtered);
  return true;
}
