import type { Playbook, Client, Capture, MasterSop } from "./types";

/** Flatten inline text for both our editor blocks and BlockNote-style blocks. */
function inlineText(b: any): string {
  if (typeof b.text === "string") return b.text;
  if (typeof b.props?.text === "string") return b.props.text;
  if (Array.isArray(b.content)) return b.content.map((c: any) => c?.text || "").join("");
  return "";
}

/** Turn a playbook or client document into readable markdown (images are skipped). */
export function blocksToMarkdown(blocks: any[] | undefined): string {
  if (!Array.isArray(blocks)) return "";
  const out: string[] = [];
  let n = 0;
  for (const b of blocks) {
    const t = inlineText(b).trim();
    const type: string = b.type;
    if (type !== "numberedListItem" && type !== "numbered_list") n = 0;

    if (type === "heading_1" || (type === "heading" && b.props?.level === 1)) out.push(`\n# ${t}`);
    else if (type === "heading_2" || (type === "heading" && b.props?.level === 2)) out.push(`\n## ${t}`);
    else if (type === "heading_3" || (type === "heading" && b.props?.level >= 3)) out.push(`\n### ${t}`);
    else if (type === "bullet_list" || type === "bulletListItem") out.push(`- ${t}`);
    else if (type === "numbered_list" || type === "numberedListItem") out.push(`${++n}. ${t}`);
    else if (type === "todo" || type === "checkListItem") out.push(`- [${b.checked || b.props?.checked ? "x" : " "}] ${t}`);
    else if (type === "callout") out.push(`> ${t}`);
    else if (type === "code_snippet") out.push("```\n" + t + "\n```");
    else if (type === "divider") out.push("---");
    else if (type === "image") continue;
    else if (t) out.push(t);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function playbookToMarkdown(p: Playbook, opts: { body?: boolean } = { body: true }): string {
  const head = [
    `## ${p.title}`,
    `slug: ${p.slug} | category: ${p.category} | region: ${p.region} | tags: ${(p.tags || []).join(", ") || "none"}`,
    p.summary ? `summary: ${p.summary}` : "",
  ].filter(Boolean);
  if (opts.body === false) return head.join("\n");
  return `${head.join("\n")}\n\n${blocksToMarkdown(p.content)}`;
}

export function clientToMarkdown(c: Client, opts: { body?: boolean } = { body: true }): string {
  const ci = c.contact_info || {};
  const done = (c.onboarding_checklist || []).filter((i) => i.completed).length;
  const lines = [
    `## ${c.company || c.name}`,
    `slug: ${c.slug} | contact: ${c.name}${ci.role ? ` (${ci.role})` : ""} | stage: ${c.stage} | region: ${c.region}`,
    [ci.email && `email: ${ci.email}`, ci.phone && `phone: ${ci.phone}`, ci.whatsapp && `whatsapp: ${ci.whatsapp}`, ci.website && `web: ${ci.website}`]
      .filter(Boolean)
      .join(" | "),
    `onboarding: ${done}/${(c.onboarding_checklist || []).length} done`,
    ...(c.onboarding_checklist || []).map((i) => `- [${i.completed ? "x" : " "}] ${i.task}${i.notes ? ` (${i.notes})` : ""}`),
  ].filter(Boolean);
  if (opts.body !== false && c.content?.length) lines.push("", "workspace notes:", blocksToMarkdown(c.content));
  return lines.join("\n");
}

export function captureToMarkdown(c: Capture, opts: { transcript?: boolean } = {}): string {
  const takeaways = (c.extracted_insights || []).map((i: any) => `- ${typeof i === "string" ? i : i.takeaway || i.title}`);
  const lines = [
    `## Capture (${c.source_type}, ${c.status}${c.source_quality ? `, source: ${c.source_quality}` : ""})`,
    c.source_url ? `url: ${c.source_url}` : "",
    c.summary ? `summary: ${c.summary}` : "",
    ...takeaways,
  ].filter(Boolean);
  if (opts.transcript) lines.push("", "transcript:", c.raw_text);
  return lines.join("\n");
}

export function masterToMarkdown(m: MasterSop, sourceTitles: string[]): string {
  return [
    `## MASTER: ${m.title}`,
    `slug: ${m.slug} | v${m.version} | category: ${m.category} | region: ${m.region} | merged from ${m.source_playbook_ids.length} SOPs: ${sourceTitles.join("; ")}`,
    m.changelog[0] ? `last change: ${m.changelog[0].summary}` : "",
    "",
    blocksToMarkdown(m.content),
  ]
    .filter((l, i) => l !== "" || i === 3)
    .join("\n");
}
