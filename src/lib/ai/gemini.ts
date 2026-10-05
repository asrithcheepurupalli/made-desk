import { llmJson, aiProvider, LlmError } from "./llm";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import type { ExtractionResult } from "./mock";

/*
 * Turns captured content into a summary, insights and proposed actions.
 * (The file name is historical: it now runs on whichever AI provider is configured.)
 * It never invents content: with no AI or a failed call it throws, and the caller marks the capture failed.
 */
export async function extractInsightsWithGemini(
  rawText: string,
  sourceUrl?: string,
  quality: "full" | "caption_only" | "manual" = "manual"
): Promise<ExtractionResult> {
  if (quality === "caption_only") {
    // Nothing real to analyse: never let a model pad a caption into fake insights.
    return captionOnlyResult(rawText);
  }
  if (aiProvider() === "none") throw new LlmError("no_provider", "No AI key is configured.");

  const userPrompt = `
Analyze this captured reel transcript / note:

SOURCE URL: ${sourceUrl || "None"}
SOURCE QUALITY: ${quality}
CONTENT:
"""
${rawText}
"""

Extract structured operational insights, category, proposed next actions, and playbook draft following the JSON schema.
`;
  const parsed = await llmJson<ExtractionResult>({ tier: "fast", maxTokens: 6000, system: EXTRACTION_SYSTEM_PROMPT, prompt: userPrompt });
  const noDash = (t: string) => String(t || "").replace(/\u2014/g, ", ").replace(/\u2013/g, "-");
  return {
    ...parsed,
    summary: noDash(parsed.summary),
    suggested_category: parsed.suggested_category || "general",
    extracted_insights: Array.isArray(parsed.extracted_insights)
      ? parsed.extracted_insights.map((i) => ({ ...i, title: noDash(i.title), takeaway: noDash(i.takeaway) }))
      : [],
    proposed_actions: Array.isArray(parsed.proposed_actions) ? parsed.proposed_actions : [],
  };
}

function captionOnlyResult(caption: string): ExtractionResult {
  const clean = caption.replace(/^CAPTION:\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 300);
  return {
    summary: `Caption only: ${clean || "no caption text"}. The video itself was not transcribed, so no insights were extracted.`,
    suggested_category: "general",
    extracted_insights: [],
    proposed_actions: [
      {
        title: "Watch the reel and paste the key points as a note",
        description: "We could only read the caption, not the spoken content. Add the real steps by hand so they can become an SOP.",
        priority: "medium",
      },
    ],
  };
}
