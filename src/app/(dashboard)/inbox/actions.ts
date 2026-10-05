import { createCapture, updateCapture, deleteCapture, getCapture } from "@/lib/data/captures";
import { createNextAction, listNextActions } from "@/lib/data/actions";
import { createPlaybook } from "@/lib/data/playbooks";
import { extractCaptureAction, analyzeTextAction } from "./extract";
import type { ExtractionResult } from "@/lib/ai/mock";
import { generateSopAction } from "./sop";
import { buildSopBlocks, buildBasicBlocks } from "@/lib/data/sopBlocks";
import type { SourceType, Capture } from "@/lib/data/types";

/** Next Actions from an extraction: at most 2, and never near-duplicates of open tasks */
async function deriveActions(captureId: string, extraction: ExtractionResult) {
  const tokens = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2));
  const similar = (a: string, b: string) => {
    const x = tokens(a);
    const y = tokens(b);
    const inter = [...x].filter((w) => y.has(w)).length;
    return inter / Math.max(1, Math.min(x.size, y.size)) >= 0.7;
  };
  const openTitles = (await listNextActions()).filter((a) => a.status !== "done").map((a) => a.title);
  for (const act of (extraction.proposed_actions || []).slice(0, 2)) {
    if (openTitles.some((t) => similar(t, act.title))) continue;
    openTitles.push(act.title);
    await createNextAction({
      title: act.title,
      description: act.description,
      priority: act.priority || "medium",
      status: "todo",
      source_capture_id: captureId,
    });
  }
}

export async function processCaptureAction(formData: FormData) {
  const rawText = (formData.get("raw_text") as string) || "";
  const sourceUrl = (formData.get("source_url") as string) || undefined;
  const sourceType = (formData.get("source_type") as SourceType) || "reel";

  if (!rawText.trim() && !sourceUrl) {
    return { error: "Please provide a reel/video URL or paste notes." };
  }

  let captureId: string | null = null;
  try {
    // 1. Save the capture in browser storage right away so it is never lost
    const capture = await createCapture({
      raw_text: rawText.trim() || `[Auto Ingestion for ${sourceUrl}]`,
      source_url: sourceUrl,
      source_type: sourceType,
      status: "pending",
      extracted_insights: [],
    });
    captureId = capture.id;

    // 2. Server does the heavy lifting (transcript, screenshots, AI) and stores nothing
    const result = await extractCaptureAction({
      captureId: capture.id,
      rawText,
      sourceUrl,
      sourceType,
    });
    const { extraction } = result;

    // The AI could not run. Keep everything we downloaded so a retry needs no new download.
    if (!extraction) {
      await updateCapture(capture.id, {
        raw_text: result.transcript || rawText.trim(),
        status: "failed",
        quality_note: `AI analysis did not run: ${result.aiError || "unknown error"} Use Retry analysis once fixed.`,
        screenshots: result.screenshots.length > 0 ? result.screenshots : undefined,
        duration_seconds: result.durationSeconds,
        source_quality: result.quality === "none" ? "caption_only" : result.quality,
      });
      return { error: `Saved, but the AI could not analyse it: ${result.aiError || "unknown error"} Open the capture and press Retry analysis once that is fixed.` };
    }

    if (result.quality === "none" && !result.transcript.trim()) {
      await updateCapture(capture.id, {
        status: "failed",
        quality_note: result.note || "Nothing could be read from this link.",
        screenshots: result.screenshots.length > 0 ? result.screenshots : undefined,
      });
      return { error: `Could not read any content from that link. ${result.note || ""} Paste the transcript as a note instead.`.trim() };
    }

    // 3. Save the results locally
    await updateCapture(capture.id, {
      raw_text: result.transcript || rawText.trim(),
      status: "processed",
      summary: extraction.summary,
      extracted_insights: extraction.extracted_insights,
      suggested_category: extraction.suggested_category,
      screenshots: result.screenshots.length > 0 ? result.screenshots : undefined,
      duration_seconds: result.durationSeconds,
      source_quality: result.quality === "none" ? "caption_only" : result.quality,
      quality_note: result.quality === "caption_only" ? result.note : undefined,
      processed_at: new Date().toISOString(),
    });

    await deriveActions(capture.id, extraction);

    return {
      success: true,
      captureId: capture.id,
      playbookDraft: extraction.playbook_draft,
    };
  } catch (error) {
    console.error("Error processing capture action:", error);
    // Keep the capture but mark it failed so it is visible and can be deleted
    if (captureId) await updateCapture(captureId, { status: "failed" }).catch(() => {});
    return { error: "Failed to process capture with AI." };
  }
}

/** Re-run the AI step on a capture whose analysis failed. No new download. */
export async function retryCaptureAnalysisAction(captureId: string) {
  const capture = await getCapture(captureId);
  if (!capture) return { error: "Capture not found." };
  const quality = capture.source_quality === "full" ? "full" : "manual";
  const { extraction, aiError } = await analyzeTextAction({ rawText: capture.raw_text, sourceUrl: capture.source_url, quality });
  if (!extraction) return { error: aiError || "The AI could not analyse this." };
  await updateCapture(captureId, {
    status: "processed",
    summary: extraction.summary,
    extracted_insights: extraction.extracted_insights,
    suggested_category: extraction.suggested_category,
    quality_note: undefined,
    processed_at: new Date().toISOString(),
  });
  await deriveActions(captureId, extraction);
  return { success: true };
}

export async function deleteCaptureAction(id: string) {
  try {
    await deleteCapture(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting capture:", error);
    return { error: "Failed to delete capture." };
  }
}

export async function promoteCaptureToPlaybookAction(
  captureId: string,
  fallbackCapture?: Capture
) {
  try {
    const capture = (await getCapture(captureId)) || fallbackCapture;
    if (!capture) return { error: "Capture not found." };

    if (capture.source_quality === "caption_only") {
      return {
        error:
          "We only have this post's caption, not its real content, so we can't write a trustworthy SOP. Watch it, paste the key points as a new note, then promote that.",
      };
    }

    const sop = await generateSopAction({
      transcript: capture.raw_text,
      summary: capture.summary,
      sourceUrl: capture.source_url,
    });

    let title = sop?.title;
    if (!title) {
      // Fallback title: first sentence of the summary, cut at a word boundary
      const first = (capture.summary || capture.raw_text || "").replace(/^(Title|CAPTION):\s*/i, "").split(/(?<=[.!?])\s/)[0].trim();
      title = first.length > 60 ? first.slice(0, 60).replace(/\s+\S*$/, "") : first;
      if (!title) title = "New Operational SOP";
    }

    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
    const slug = `${baseSlug || "sop"}-${Date.now().toString().slice(-4)}`;

    let category: any = sop?.category || "acquisition";
    if (!sop) {
      const cat = capture.suggested_category?.toLowerCase() || "";
      if (cat.includes("onboard")) category = "onboarding";
      else if (cat.includes("outreach") || cat.includes("cold")) category = "outreach";
      else if (cat.includes("price") || cat.includes("rate")) category = "pricing";
      else if (cat.includes("deliver")) category = "delivery";
    }

    const playbook = await createPlaybook({
      slug,
      title,
      category,
      region: sop?.region || "global",
      tags: sop?.tags?.length ? sop.tags : ["capture-derived", "sop", category],
      summary: sop?.summary || capture.summary || "Operational playbook derived from research capture.",
      content: sop ? buildSopBlocks(sop, capture) : buildBasicBlocks(title, capture),
      source_capture_ids: [capture.id],
    });

    return { success: true, slug: playbook.slug };
  } catch (error: any) {
    console.error("Error promoting capture to playbook:", error);
    return { error: error?.message || "Failed to convert capture to playbook." };
  }
}
