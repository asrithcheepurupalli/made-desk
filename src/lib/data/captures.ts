import { supabaseAdmin } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import type { Capture } from "./types";

const FILENAME = "captures.json";

export async function listCaptures(): Promise<Capture[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("captures")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data as Capture[];
  }
  const items = await readJsonFile<Capture[]>(FILENAME, []);
  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getCapture(id: string): Promise<Capture | null> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("captures")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return data as Capture;
  }
  const items = await readJsonFile<Capture[]>(FILENAME, []);
  return items.find((c) => c.id === id) ?? null;
}

export async function createCapture(
  input: Omit<Capture, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<Capture> {
  const now = new Date().toISOString();
  const capture: Capture = {
    id: input.id || crypto.randomUUID(),
    raw_text: input.raw_text,
    source_url: input.source_url,
    source_type: input.source_type || "reel",
    status: input.status || "pending",
    summary: input.summary,
    extracted_insights: input.extracted_insights || [],
    suggested_category: input.suggested_category || "general",
    processed_at: input.processed_at,
    created_at: now,
    updated_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("captures").insert([capture]);
  } else {
    const items = await readJsonFile<Capture[]>(FILENAME, []);
    items.unshift(capture);
    await writeJsonFile(FILENAME, items);
  }

  return capture;
}

export async function updateCapture(
  id: string,
  patch: Partial<Capture>
): Promise<Capture | null> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("captures")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (!error && data) return data as Capture;
  }

  const items = await readJsonFile<Capture[]>(FILENAME, []);
  const idx = items.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updated_at: now };
  await writeJsonFile(FILENAME, items);
  return items[idx];
}

export async function deleteCapture(id: string): Promise<boolean> {
  const sb = supabaseAdmin();
  if (sb) {
    const { error } = await sb.from("captures").delete().eq("id", id);
    return !error;
  }
  const items = await readJsonFile<Capture[]>(FILENAME, []);
  const filtered = items.filter((c) => c.id !== id);
  await writeJsonFile(FILENAME, filtered);
  return true;
}
