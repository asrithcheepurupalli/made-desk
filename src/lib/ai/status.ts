"use server";

import { aiProvider, modelFor } from "./llm";

/** Which AI the desk is running on, for the sidebar. No keys, just names. */
export async function getAiStatusAction(): Promise<{ provider: string; label: string; ok: boolean }> {
  const provider = aiProvider();
  if (provider === "none") return { provider, label: "No AI key", ok: false };
  const model = modelFor("fast", provider);
  const label = provider === "anthropic" ? "Claude" : provider === "gemini" ? "Gemini" : model ? model.split("/").pop()!.slice(0, 22) : "Router";
  return { provider, label, ok: true };
}
