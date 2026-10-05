import type { Capture } from "./types";
import type { GeneratedSop } from "@/app/(dashboard)/inbox/sop";

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
export function buildSopBlocks(sop: GeneratedSop, capture: Capture): any[] {
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
export function buildBasicBlocks(title: string, capture: Capture): any[] {
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

