import { supabaseAdmin, must } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import type { TrackedLink } from "./types";

const FILENAME = "tracked_links.json";
const CODE_CHARS = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export function generateCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function listTrackedLinks(filter?: { campaign?: string }): Promise<TrackedLink[]> {
  const sb = supabaseAdmin();
  if (sb) {
    let query = sb.from("tracked_links").select("*").order("created_at", { ascending: false });
    if (filter?.campaign) query = query.eq("campaign", filter.campaign);
    const { data, error } = await query;
    must({ error }, "list tracked links");
    return (data ?? []) as TrackedLink[];
  }

  const items = await readJsonFile<TrackedLink[]>(FILENAME, []);
  const sorted = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return filter?.campaign ? sorted.filter((l) => l.campaign === filter.campaign) : sorted;
}

export async function getTrackedLinkByCode(code: string): Promise<TrackedLink | null> {
  const clean = decodeURIComponent(code).trim();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("tracked_links")
      .select("*")
      .eq("code", clean)
      .maybeSingle();
    must({ error }, "get tracked link");
    return (data as TrackedLink) ?? null;
  }

  const items = await listTrackedLinks();
  return items.find((l) => l.code === clean) ?? null;
}

export async function createTrackedLink(
  input: Omit<TrackedLink, "id" | "code" | "click_count" | "created_at" | "updated_at"> & {
    code?: string;
  }
): Promise<TrackedLink> {
  const now = new Date().toISOString();
  const link: TrackedLink = {
    id: crypto.randomUUID(),
    code: input.code || generateCode(),
    target_url: input.target_url,
    label: input.label,
    campaign: input.campaign,
    contact_name: input.contact_name,
    contact_phone: input.contact_phone,
    click_count: 0,
    created_at: now,
    updated_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    must(await sb.from("tracked_links").insert([link]), "tracked link insert");
  } else {
    const items = await listTrackedLinks();
    items.unshift(link);
    await writeJsonFile(FILENAME, items);
  }

  return link;
}

export async function updateTrackedLink(
  id: string,
  patch: Partial<Pick<TrackedLink, "message" | "label">> & { sent_at?: string | null }
): Promise<TrackedLink | null> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("tracked_links")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select()
      .maybeSingle();
    must({ error }, "tracked link update");
    return (data as TrackedLink) ?? null;
  }

  const items = await listTrackedLinks();
  const idx = items.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const { sent_at, ...rest } = patch;
  items[idx] = { ...items[idx], ...rest, sent_at: sent_at ?? undefined, updated_at: now };
  await writeJsonFile(FILENAME, items);
  return items[idx];
}

export async function markSent(id: string, sent: boolean): Promise<TrackedLink | null> {
  return updateTrackedLink(id, { sent_at: sent ? new Date().toISOString() : null });
}

export async function recordClick(
  linkId: string,
  event?: { userAgent?: string | null; referrer?: string | null }
): Promise<void> {
  const now = new Date().toISOString();
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("tracked_links")
      .select("click_count")
      .eq("id", linkId)
      .maybeSingle();
    must({ error }, "read tracked link for click");
    const nextCount = ((data?.click_count as number) ?? 0) + 1;

    must(
      await sb
        .from("tracked_links")
        .update({ click_count: nextCount, last_clicked_at: now, updated_at: now })
        .eq("id", linkId),
      "tracked link click update"
    );
    must(
      await sb.from("link_click_events").insert([
        {
          id: crypto.randomUUID(),
          link_id: linkId,
          clicked_at: now,
          user_agent: event?.userAgent || null,
          referrer: event?.referrer || null,
        },
      ]),
      "link click event insert"
    );
    return;
  }

  const items = await listTrackedLinks();
  const idx = items.findIndex((l) => l.id === linkId);
  if (idx === -1) return;
  items[idx] = {
    ...items[idx],
    click_count: items[idx].click_count + 1,
    last_clicked_at: now,
    updated_at: now,
  };
  await writeJsonFile(FILENAME, items);
}
