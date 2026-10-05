"use server";

import { extractInsightsWithGemini } from "@/lib/ai/gemini";
import { explainAiError } from "@/lib/ai/llm";
import { extractMediaFromUrl } from "@/lib/media/extractor";
import type { ExtractionResult } from "@/lib/ai/mock";
import type { SourceType, SourceQuality } from "@/lib/data/types";

export interface CaptureExtraction {
  transcript: string;
  screenshots: string[];
  durationSeconds?: number;
  quality: SourceQuality | "none";
  note?: string;
  /** null when the AI could not run: the transcript is still returned so nothing is lost */
  extraction: ExtractionResult | null;
  aiError?: string;
}

/**
 * Stateless: pulls the transcript and screenshots and runs the AI extraction.
 * Nothing is stored here. The browser saves the result in its own storage.
 */
export async function extractCaptureAction(input: {
  captureId: string;
  rawText: string;
  sourceUrl?: string;
  sourceType: SourceType;
}): Promise<CaptureExtraction> {
  const { captureId, rawText, sourceUrl, sourceType } = input;
  const notes = rawText.trim();
  let transcript = notes;
  let screenshots: string[] = [];
  let durationSeconds: number | undefined;
  let quality: SourceQuality | "none" = notes ? "manual" : "none";
  let note: string | undefined;

  if (sourceUrl) {
    try {
      const media = await extractMediaFromUrl(sourceUrl, captureId);
      screenshots = media.screenshots;
      durationSeconds = media.durationSeconds;
      note = media.note;
      if (media.transcript.trim()) {
        // Our own notes go first and count as real content
        transcript = notes ? `NOTES:\n${notes}\n\n${media.transcript}` : media.transcript;
        quality = media.quality === "full" ? "full" : notes ? "manual" : media.quality;
      }
    } catch (err) {
      console.warn("Media extraction warning:", err);
      note = "Extraction failed.";
    }
  }

  try {
    const extraction =
      quality === "none"
        ? await extractInsightsWithGemini(transcript || `Content from ${sourceUrl}`, sourceUrl, "caption_only")
        : await extractInsightsWithGemini(transcript, sourceUrl, quality);
    return { transcript, screenshots, durationSeconds, quality, note, extraction };
  } catch (err) {
    console.warn("[made. desk] AI analysis failed:", err);
    return { transcript, screenshots, durationSeconds, quality, note, extraction: null, aiError: explainAiError(err) };
  }
}

/** Re-run only the AI step on text we already have (no download). Used by Retry. */
export async function analyzeTextAction(input: {
  rawText: string;
  sourceUrl?: string;
  quality: SourceQuality;
}): Promise<{ extraction: ExtractionResult | null; aiError?: string }> {
  try {
    return { extraction: await extractInsightsWithGemini(input.rawText, input.sourceUrl, input.quality) };
  } catch (err) {
    return { extraction: null, aiError: explainAiError(err) };
  }
}
