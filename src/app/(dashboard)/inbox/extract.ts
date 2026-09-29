"use server";

import { extractInsightsWithGemini } from "@/lib/ai/gemini";
import { extractMediaFromUrl } from "@/lib/media/extractor";
import type { ExtractionResult } from "@/lib/ai/mock";
import type { SourceType } from "@/lib/data/types";

export interface CaptureExtraction {
  transcript: string;
  screenshots: string[];
  durationSeconds?: number;
  extraction: ExtractionResult;
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
  let transcript = rawText.trim();
  let screenshots: string[] = [];
  let durationSeconds: number | undefined;

  const isVideo =
    sourceUrl &&
    (sourceType === "reel" ||
      sourceType === "youtube" ||
      sourceUrl.includes("instagram.com") ||
      sourceUrl.includes("youtube.com") ||
      sourceUrl.includes("youtu.be"));

  if (isVideo) {
    try {
      const media = await extractMediaFromUrl(sourceUrl!, captureId);
      if (media.transcript?.trim()) transcript = media.transcript;
      if (media.screenshots?.length) screenshots = media.screenshots;
      if (media.durationSeconds) durationSeconds = media.durationSeconds;
    } catch (err) {
      console.warn("Media extraction warning:", err);
    }
  }

  const extraction = await extractInsightsWithGemini(transcript || `Content from ${sourceUrl}`, sourceUrl);
  return { transcript, screenshots, durationSeconds, extraction };
}
