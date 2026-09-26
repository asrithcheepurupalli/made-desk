import { supabaseAdmin } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import { SEED_CLIENTS } from "./seeds";
import type { Client } from "./types";

const FILENAME = "clients.json";

export async function listClients(): Promise<Client[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data as Client[];
  }

  const items = await readJsonFile<Client[]>(FILENAME, []);
  return items;
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("clients")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return data as Client;
  }

  const items = await listClients();
  return items.find((c) => c.slug === slug) ?? null;
}

export async function getClientById(id: string): Promise<Client | null> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return data as Client;
  }

  const items = await listClients();
  return items.find((c) => c.id === id) ?? null;
}

export async function createClient(
  input: Omit<Client, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<Client> {
  const now = new Date().toISOString();
  const client: Client = {
    id: input.id || crypto.randomUUID(),
    slug: input.slug,
    name: input.name,
    company: input.company,
    stage: input.stage || "lead",
    region: input.region || "global",
    contact_info: input.contact_info || {},
    onboarding_checklist: input.onboarding_checklist || [],
    content: input.content || [],
    tags: input.tags || [],
    created_at: now,
    updated_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("clients").insert([client]);
  } else {
    const items = await listClients();
    items.unshift(client);
    await writeJsonFile(FILENAME, items);
  }

  return client;
}

export async function updateClient(
  slugOrId: string,
  patch: Partial<Client>
): Promise<Client | null> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("clients")
      .update({ ...patch, updated_at: now })
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .select()
      .maybeSingle();
    if (!error && data) return data as Client;
  }

  const items = await listClients();
  const idx = items.findIndex((c) => c.slug === slugOrId || c.id === slugOrId);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updated_at: now };
  await writeJsonFile(FILENAME, items);
  return items[idx];
}

export async function deleteClient(slugOrId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb
      .from("clients")
      .delete()
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
    return !error;
  }
  const items = await listClients();
  const filtered = items.filter((c) => c.slug !== slugOrId && c.id !== slugOrId);
  await writeJsonFile(FILENAME, filtered);
  return true;
}
