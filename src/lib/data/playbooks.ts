import { supabaseAdmin, must, slugOrIdFilter } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { SEED_PLAYBOOKS } from "./seeds";
import type { Playbook } from "./types";

const FILENAME = "playbooks.json";

/** New or edited SOPs may overlap with others: let the master pages catch up (browser only). */
function pingMasters(delay: number) {
  if (typeof window !== "undefined") {
    import("@/lib/masters/sync").then((m) => m.scheduleMasterSync(delay)).catch(() => {});
  }
}

export async function listPlaybooks(): Promise<Playbook[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .select("*")
      .order("created_at", { ascending: false });
    must({ error }, "list playbooks");
    return (data ?? []) as Playbook[];
  }

  const items = await readJsonFile<Playbook[]>(FILENAME, []);
  return items;
}

export async function getPlaybookBySlug(slug: string): Promise<Playbook | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .select("*")
      .or(slugOrIdFilter(cleanSlug))
      .limit(1)
      .maybeSingle();
    must({ error }, "get playbook");
    return (data as Playbook) ?? null;
  }

  const items = await listPlaybooks();
  return (
    items.find(
      (p) =>
        p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug
    ) ?? null
  );
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
    must(await sb.from("playbooks").insert([playbook]), "playbook insert");
  } else {
    const items = await listPlaybooks();
    items.unshift(playbook);
    await writeJsonFile(FILENAME, items);
  }

  pingMasters(4000);
  return playbook;
}

export async function updatePlaybook(
  slug: string,
  patch: Partial<Playbook>
): Promise<Playbook | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("playbooks")
      .update({ ...patch, updated_at: now })
      .or(slugOrIdFilter(cleanSlug))
      .select()
      .maybeSingle();
    must({ error }, "playbook update");
    return (data as Playbook) ?? null;
  }

  const items = await listPlaybooks();
  const idx = items.findIndex((p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updated_at: now };
  await writeJsonFile(FILENAME, items);
  if (patch.content || patch.title) pingMasters(30000);
  return items[idx];
}

export async function deletePlaybook(slug: string): Promise<boolean> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const sb = supabaseAdmin();
  if (sb) {
    must(await sb.from("playbooks").delete().or(slugOrIdFilter(cleanSlug)), "playbook delete");
    return true;
  }
  const items = await listPlaybooks();
  const filtered = items.filter((p) => p.slug.toLowerCase() !== cleanSlug && p.id !== cleanSlug);
  await writeJsonFile(FILENAME, filtered);
  pingMasters(4000);
  return true;
}
