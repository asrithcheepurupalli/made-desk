import { createCapture, updateCapture, deleteCapture, getCapture } from "@/lib/data/captures";
import { createNextAction } from "@/lib/data/actions";
import { createPlaybook } from "@/lib/data/playbooks";
import { extractCaptureAction } from "./extract";
import { generateSopAction, type GeneratedSop } from "./sop";
import type { SourceType, Capture } from "@/lib/data/types";

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

    // 4. Derive Next Actions
    for (const act of extraction.proposed_actions || []) {
      await createNextAction({
        title: act.title,
        description: act.description,
        priority: act.priority || "medium",
        status: "todo",
        source_capture_id: capture.id,
      });
    }

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

export async function deleteCaptureAction(id: string) {
  try {
    await deleteCapture(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting capture:", error);
    return { error: "Failed to delete capture." };
  }
}

let blockSeq = 0;
const bid = (kind: string) => `b-${kind}-${Date.now()}-${blockSeq++}`;

function sourceBlocks(capture: Capture): any[] {
  const out: any[] = [];
  if (capture.screenshots && capture.screenshots.length > 0) {
    out.push({ id: bid("shots"), type: "heading_2", text: "Visual references" });
    capture.screenshots.forEach((src: string, idx: number) => {
      out.push({ id: bid("img"), type: "image", text: `Source frame ${idx + 1}`, url: src });
    });
  }
  if (capture.source_url) {
    out.push({
      id: bid("src"),
      type: "callout",
      text: `Source: ${capture.source_url}. Written only from what the source says. Anything it left out is listed under "Not covered by the source".`,
    });
  }
  return out;
}

/** Full, structured SOP written from the whole transcript */
function buildSopBlocks(sop: GeneratedSop, capture: Capture): any[] {
  const b: any[] = [{ id: bid("title"), type: "heading_1", text: sop.title }];
  if (sop.summary) b.push({ id: bid("sum"), type: "paragraph", text: sop.summary });
  if (sop.purpose) {
    b.push({ id: bid("h"), type: "heading_2", text: "Purpose" }, { id: bid("p"), type: "paragraph", text: sop.purpose });
  }
  if (sop.when_to_use) {
    b.push({ id: bid("h"), type: "heading_2", text: "When to use" }, { id: bid("p"), type: "paragraph", text: sop.when_to_use });
  }
  b.push({ id: bid("h"), type: "heading_2", text: "Procedure" });
  sop.steps.forEach((st) =>
    b.push({ id: bid("step"), type: "numbered_list", text: st.details ? `${st.title}: ${st.details}` : st.title })
  );
  if (sop.scripts.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Scripts and examples (verbatim from source)" });
    sop.scripts.forEach((sc) => {
      if (sc.label) b.push({ id: bid("lbl"), type: "callout", text: sc.label });
      b.push({ id: bid("code"), type: "code_snippet", text: sc.text });
    });
  }
  if (sop.rules.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Rules" });
    sop.rules.forEach((r) => b.push({ id: bid("rule"), type: "bullet_list", text: r }));
  }
  if (sop.checklist.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Checklist before we apply this" });
    sop.checklist.forEach((c) => b.push({ id: bid("chk"), type: "todo", text: c, checked: false }));
  }
  if (sop.not_covered.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Not covered by the source" });
    sop.not_covered.forEach((g) => b.push({ id: bid("gap"), type: "bullet_list", text: g }));
  }
  b.push(...sourceBlocks(capture));
  return b;
}

/** Fallback when the AI is unavailable: keep the summary and takeaways */
function buildBasicBlocks(title: string, capture: Capture): any[] {
  const b: any[] = [
    { id: bid("title"), type: "heading_1", text: title },
    { id: bid("sum"), type: "paragraph", text: capture.summary || capture.raw_text },
  ];
  if (capture.extracted_insights?.length) {
    b.push({ id: bid("h"), type: "heading_2", text: "Key rules" });
    capture.extracted_insights.forEach((item: any) =>
      b.push({ id: bid("todo"), type: "todo", text: typeof item === "string" ? item : item.takeaway || item.title, checked: false })
    );
  }
  b.push(...sourceBlocks(capture));
  return b;
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
