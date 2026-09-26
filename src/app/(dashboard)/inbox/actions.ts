"use server";

import { revalidatePath } from "next/cache";
import { createCapture, updateCapture, deleteCapture, getCapture } from "@/lib/data/captures";
import { createNextAction } from "@/lib/data/actions";
import { createPlaybook } from "@/lib/data/playbooks";
import { extractInsightsWithGemini } from "@/lib/ai/gemini";
import { extractMediaFromUrl } from "@/lib/media/extractor";
import type { SourceType } from "@/lib/data/types";

export async function processCaptureAction(formData: FormData) {
  const rawText = (formData.get("raw_text") as string) || "";
  const sourceUrl = (formData.get("source_url") as string) || undefined;
  const sourceType = (formData.get("source_type") as SourceType) || "reel";

  if (!rawText.trim() && !sourceUrl) {
    return { error: "Please provide a reel/video URL or paste notes." };
  }

  try {
    // 1. Create initial capture record
    const capture = await createCapture({
      raw_text: rawText.trim() || `[Auto Ingestion for ${sourceUrl}]`,
      source_url: sourceUrl,
      source_type: sourceType,
      status: "pending",
      extracted_insights: [],
    });

    let effectiveTranscript = rawText.trim();
    let screenshots: string[] = [];
    let durationSeconds: number | undefined = undefined;

    // 2. If a video URL is provided, run automated yt-dlp + ffmpeg + Gemini audio transcription & screenshots
    if (
      sourceUrl &&
      (sourceType === "reel" ||
        sourceType === "youtube" ||
        sourceUrl.includes("instagram.com") ||
        sourceUrl.includes("youtube.com") ||
        sourceUrl.includes("youtu.be"))
    ) {
      try {
        const media = await extractMediaFromUrl(sourceUrl, capture.id);
        if (media.transcript && media.transcript.trim().length > 0) {
          effectiveTranscript = media.transcript;
        }
        if (media.screenshots && media.screenshots.length > 0) {
          screenshots = media.screenshots;
        }
        if (media.durationSeconds) {
          durationSeconds = media.durationSeconds;
        }
      } catch (mediaErr) {
        console.warn("Media extraction warning:", mediaErr);
      }
    }

    // 3. Run Gemini structured extraction on the transcript
    const extraction = await extractInsightsWithGemini(
      effectiveTranscript || `Content from ${sourceUrl}`,
      sourceUrl
    );

    // 4. Update capture record
    await updateCapture(capture.id, {
      raw_text: effectiveTranscript || rawText.trim(),
      status: "processed",
      summary: extraction.summary,
      extracted_insights: extraction.extracted_insights,
      suggested_category: extraction.suggested_category,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      duration_seconds: durationSeconds,
      processed_at: new Date().toISOString(),
    });

    // 5. Auto-populate Next Actions derived from extraction
    if (extraction.proposed_actions && extraction.proposed_actions.length > 0) {
      for (const act of extraction.proposed_actions) {
        await createNextAction({
          title: act.title,
          description: act.description,
          priority: act.priority || "medium",
          status: "todo",
          source_capture_id: capture.id,
        });
      }
    }

    revalidatePath("/inbox");
    revalidatePath("/actions");
    revalidatePath("/playbooks");

    return {
      success: true,
      captureId: capture.id,
      playbookDraft: extraction.playbook_draft,
    };
  } catch (error) {
    console.error("Error processing capture action:", error);
    return { error: "Failed to process capture with AI." };
  }
}

export async function deleteCaptureAction(id: string) {
  try {
    await deleteCapture(id);
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    console.error("Error deleting capture:", error);
    return { error: "Failed to delete capture." };
  }
}

export async function promoteCaptureToPlaybookAction(captureId: string) {
  try {
    const capture = await getCapture(captureId);
    if (!capture) return { error: "Capture not found." };

    // Clean up title from summary or raw text
    let cleanTitle = (capture.summary || capture.raw_text || "Agency Operational SOP")
      .replace(/^Title:\s*/i, "")
      .replace(/^.*?\s+on\s+Instagram:\s*"?/i, "")
      .replace(/"/g, "")
      .trim();

    if (cleanTitle.length > 60) {
      cleanTitle = cleanTitle.slice(0, 60).trim();
    }
    if (!cleanTitle) cleanTitle = "New Operational SOP";

    const baseSlug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    const slug = `${baseSlug || "sop"}-${Date.now().toString().slice(-4)}`;

    const contentBlocks: any[] = [
      {
        id: `b-title-${Date.now()}`,
        type: "heading_1",
        text: cleanTitle,
      },
      {
        id: `b-summary-${Date.now()}`,
        type: "paragraph",
        text: capture.summary || capture.raw_text,
      },
    ];

    // Embed screenshots if available
    if (capture.screenshots && capture.screenshots.length > 0) {
      contentBlocks.push({
        id: `b-shots-head-${Date.now()}`,
        type: "heading_2",
        text: "Source Reel Keyframes & Visual References",
      });

      capture.screenshots.forEach((src, idx) => {
        contentBlocks.push({
          id: `b-img-${Date.now()}-${idx}`,
          type: "image",
          text: `Source visual frame ${idx + 1}`,
          url: src,
        });
      });
    }

    // Embed structured takeaway checklist
    if (capture.extracted_insights && capture.extracted_insights.length > 0) {
      contentBlocks.push({
        id: `b-takeaways-head-${Date.now()}`,
        type: "heading_2",
        text: "Key Operational Rules & Checklist",
      });

      capture.extracted_insights.forEach((item, idx) => {
        contentBlocks.push({
          id: `b-todo-${Date.now()}-${idx}`,
          type: "todo",
          text: typeof item === "string" ? item : item.takeaway || item.title,
          checked: false,
        });
      });
    }

    // Embed callout with source URL if exists
    if (capture.source_url) {
      contentBlocks.push({
        id: `b-callout-${Date.now()}`,
        type: "callout",
        text: `Originally captured from ${capture.source_url}. Verified and stored in made. desk knowledge base.`,
      });
    }

    // Infer category
    let category: any = "acquisition";
    const cat = capture.suggested_category?.toLowerCase() || "";
    if (cat.includes("onboard")) category = "onboarding";
    else if (cat.includes("outreach") || cat.includes("cold")) category = "outreach";
    else if (cat.includes("price") || cat.includes("rate")) category = "pricing";
    else if (cat.includes("deliver")) category = "delivery";

    const playbook = await createPlaybook({
      slug,
      title: cleanTitle,
      category,
      region: "global",
      tags: ["capture-derived", "sop", category],
      summary: capture.summary || "Operational playbook derived from research capture.",
      content: contentBlocks,
      source_capture_ids: [capture.id],
    });

    revalidatePath("/playbooks");
    revalidatePath("/inbox");
    revalidatePath("/dashboard");
    return { success: true, slug: playbook.slug };
  } catch (error: any) {
    console.error("Error promoting capture to playbook:", error);
    return { error: error?.message || "Failed to convert capture to playbook." };
  }
}
