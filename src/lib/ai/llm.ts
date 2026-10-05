/*
 * One place that talks to a language model, so the app is not tied to a single vendor.
 * Server-side only: keys come from the environment and never reach the browser.
 *
 * Provider is picked automatically (override with LLM_PROVIDER):
 *   anthropic  ANTHROPIC_API_KEY                          (Claude: text + images)
 *   compat     OPENAI_COMPAT_BASE_URL + _API_KEY + _MODEL (any OpenAI-style router)
 *   gemini     GEMINI_API_KEY                             (legacy)
 */

export type Tier = "fast" | "smart";
export type Provider = "anthropic" | "compat" | "gemini" | "none";

export class LlmError extends Error {
  constructor(public code: "no_provider" | "auth" | "billing" | "rate" | "http" | "bad_output", message: string) {
    super(message);
  }
}

export interface LlmOpts {
  prompt: string;
  system?: string;
  /** fast = cheap and quick (grouping, triage, chat). smart = best writing (SOPs, merges). */
  tier?: Tier;
  maxTokens?: number;
  temperature?: number;
  /** JPEG data URIs sent alongside the prompt (needs a vision-capable model) */
  images?: string[];
  timeoutMs?: number;
}

const env = (k: string) => (process.env[k] || "").trim();

export function aiProvider(): Provider {
  const forced = env("LLM_PROVIDER") as Provider;
  if (forced === "anthropic" && env("ANTHROPIC_API_KEY")) return "anthropic";
  if (forced === "compat" && env("OPENAI_COMPAT_BASE_URL")) return "compat";
  if (forced === "gemini" && (env("GEMINI_API_KEY") || env("GOOGLE_API_KEY"))) return "gemini";
  if (env("ANTHROPIC_API_KEY")) return "anthropic";
  if (env("OPENAI_COMPAT_BASE_URL") && env("OPENAI_COMPAT_API_KEY")) return "compat";
  if (env("GEMINI_API_KEY") || env("GOOGLE_API_KEY")) return "gemini";
  return "none";
}

export function modelFor(tier: Tier, provider = aiProvider()): string {
  if (provider === "anthropic") return tier === "smart" ? env("LLM_MODEL_SMART") || "claude-sonnet-5" : env("LLM_MODEL_FAST") || "claude-haiku-4-5-20251001";
  if (provider === "compat") return (tier === "smart" ? env("OPENAI_COMPAT_MODEL_SMART") : env("OPENAI_COMPAT_MODEL_FAST")) || env("OPENAI_COMPAT_MODEL");
  return "gemini-2.5-flash";
}

const stripData = (uri: string) => uri.replace(/^data:image\/\w+;base64,/, "");

function fail(status: number, body: string): never {
  const msg = body.slice(0, 300);
  if (status === 401 || status === 403) throw new LlmError(/billing|credit|dunning|quota/i.test(msg) ? "billing" : "auth", `AI provider refused the key (${status}): ${msg}`);
  if (status === 402) throw new LlmError("billing", `AI provider says the account is out of credit: ${msg}`);
  if (status === 429 || status === 529) throw new LlmError("rate", `AI provider is busy (${status}). Try again shortly.`);
  throw new LlmError("http", `AI provider error ${status}: ${msg}`);
}

async function post(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    if ((res.status === 429 || res.status === 529 || res.status >= 500) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 2500));
      continue;
    }
    if (!res.ok) fail(res.status, await res.text());
    return res.json();
  }
}

export async function llm(opts: LlmOpts): Promise<string> {
  const provider = aiProvider();
  const tier = opts.tier || "fast";
  const timeout = opts.timeoutMs || (tier === "smart" ? 120000 : 60000);
  const maxTokens = opts.maxTokens || (tier === "smart" ? 8000 : 4000);
  const images = opts.images || [];

  if (provider === "anthropic") {
    const content: any[] = [...images.map((d) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: stripData(d) } })), { type: "text", text: opts.prompt }];
    const data = await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" },
      { model: modelFor(tier, provider), max_tokens: maxTokens, ...(opts.system ? { system: opts.system } : {}), messages: [{ role: "user", content }] },
      timeout
    );
    const text = (data?.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    if (!text.trim()) throw new LlmError("bad_output", "The AI returned an empty answer.");
    return text;
  }

  if (provider === "compat") {
    const base = env("OPENAI_COMPAT_BASE_URL").replace(/\/+$/, "");
    const content: any[] = [...images.map((d) => ({ type: "image_url", image_url: { url: d } })), { type: "text", text: opts.prompt }];
    const data = await post(
      `${base}/chat/completions`,
      { Authorization: `Bearer ${env("OPENAI_COMPAT_API_KEY")}` },
      { model: modelFor(tier, provider), max_tokens: maxTokens, ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}), messages: [...(opts.system ? [{ role: "system", content: opts.system }] : []), { role: "user", content: images.length ? content : opts.prompt }] },
      timeout
    );
    const text = data?.choices?.[0]?.message?.content || "";
    if (!String(text).trim()) throw new LlmError("bad_output", "The AI returned an empty answer.");
    return String(text);
  }

  if (provider === "gemini") {
    const key = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
    const parts: any[] = [...images.map((d) => ({ inlineData: { mimeType: "image/jpeg", data: stripData(d) } })), { text: (opts.system ? opts.system + "\n\n" : "") + opts.prompt }];
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {},
      { contents: [{ role: "user", parts }], generationConfig: { maxOutputTokens: maxTokens, ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}) } },
      timeout
    );
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
    if (!text.trim()) throw new LlmError("bad_output", "The AI returned an empty answer.");
    return text;
  }

  throw new LlmError("no_provider", "No AI key is configured. Set ANTHROPIC_API_KEY.");
}

/** Ask for JSON and parse it, tolerating code fences and chatter around it. */
export async function llmJson<T>(opts: LlmOpts): Promise<T> {
  const text = await llm({ ...opts, prompt: opts.prompt + "\n\nReturn ONLY valid JSON. No code fences, no commentary." });
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start < 0 || end < start) throw new LlmError("bad_output", "The AI did not return JSON.");
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new LlmError("bad_output", "The AI returned JSON that could not be read.");
  }
}

/** Short, user-facing reason for a failed AI call. */
export function explainAiError(err: unknown): string {
  if (err instanceof LlmError) {
    if (err.code === "no_provider") return "No AI key is set. Add ANTHROPIC_API_KEY.";
    if (err.code === "billing") return "The AI account is out of credit or suspended.";
    if (err.code === "auth") return "The AI key was rejected.";
    if (err.code === "rate") return "The AI is busy. Try again in a minute.";
    return err.message;
  }
  return "The AI request failed.";
}
