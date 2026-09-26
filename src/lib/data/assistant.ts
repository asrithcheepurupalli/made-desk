import { supabaseAdmin } from "@/lib/supabase/server";
import { readJsonFile, writeJsonFile } from "@/lib/supabase/filestore";
import type { AssistantMessage } from "./types";

const FILENAME = "assistant_messages.json";

export async function listAssistantMessages(sessionId = "default"): Promise<AssistantMessage[]> {
  const sb = supabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("assistant_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (!error && data) return data as AssistantMessage[];
  }

  const items = await readJsonFile<AssistantMessage[]>(FILENAME, []);
  return items.filter((m) => m.session_id === sessionId);
}

export async function createAssistantMessage(
  input: Omit<AssistantMessage, "id" | "created_at"> & { id?: string }
): Promise<AssistantMessage> {
  const now = new Date().toISOString();
  const message: AssistantMessage = {
    id: input.id || crypto.randomUUID(),
    session_id: input.session_id || "default",
    role: input.role,
    content: input.content,
    cited_sources: input.cited_sources || [],
    created_at: now,
  };

  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("assistant_messages").insert([message]);
  } else {
    const items = await readJsonFile<AssistantMessage[]>(FILENAME, []);
    items.push(message);
    await writeJsonFile(FILENAME, items);
  }

  return message;
}

export async function clearAssistantSession(sessionId = "default"): Promise<void> {
  const sb = supabaseAdmin();
  if (sb) {
    await sb.from("assistant_messages").delete().eq("session_id", sessionId);
    return;
  }
  const items = await readJsonFile<AssistantMessage[]>(FILENAME, []);
  const filtered = items.filter((m) => m.session_id !== sessionId);
  await writeJsonFile(FILENAME, filtered);
}
