import type { SuggestedCategory, PlaybookCategory, Region, ActionPriority } from "@/lib/data/types";

export interface ExtractionResult {
  summary: string;
  suggested_category: SuggestedCategory;
  extracted_insights: Array<{
    title: string;
    takeaway: string;
    category: string;
  }>;
  proposed_actions: Array<{
    title: string;
    description: string;
    priority: ActionPriority;
  }>;
  playbook_draft?: {
    title: string;
    category: PlaybookCategory;
    region: Region;
    tags: string[];
    summary: string;
    content: any[];
  };
}

export function mockExtractFromText(rawText: string, sourceUrl?: string): ExtractionResult {
  const lower = rawText.toLowerCase();

  // Detect category keywords
  let category: PlaybookCategory = "acquisition";
  let suggestedCategory: SuggestedCategory = "playbook";
  let region: Region = "global";

  if (lower.includes("uae") || lower.includes("dubai") || lower.includes("abu dhabi") || lower.includes("gcc")) {
    region = "uae";
  } else if (lower.includes("india") || lower.includes("bangalore") || lower.includes("mumbai")) {
    region = "india";
  } else if (lower.includes("us") || lower.includes("america") || lower.includes("california")) {
    region = "us";
  }

  if (lower.includes("onboard") || lower.includes("asset") || lower.includes("welcome") || lower.includes("checklist")) {
    category = "onboarding";
    suggestedCategory = "playbook";
  } else if (lower.includes("pricing") || lower.includes("retainer") || lower.includes("rate") || lower.includes("quote")) {
    category = "pricing";
  } else if (lower.includes("followup") || lower.includes("follow up") || lower.includes("cadence") || lower.includes("touch")) {
    category = "outreach";
  } else if (lower.includes("action") || lower.includes("todo") || lower.includes("task")) {
    suggestedCategory = "action";
  }

  // Generate lines / key points
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const summary =
    lines[0] ||
    "Key tactical insight on agency operations and client acquisition captured for made. studio.";

  const insights = [
    {
      title: "Core Operational Principle",
      takeaway: lines[0] || "Rapid multi-channel presence and high-touch communication build immediate trust.",
      category: category,
    },
    {
      title: "Tactical Execution Step",
      takeaway: lines[1] || "Deliver high-signal visual prototypes and clear fixed-scope deliverables to eliminate friction.",
      category: category,
    },
  ];

  if (lines.length > 2) {
    insights.push({
      title: "Follow-Through Standard",
      takeaway: lines[2] || "Establish structured response timelines and keep client check-ins concise.",
      category: category,
    });
  }

  const proposedActions: Array<{ title: string; description: string; priority: ActionPriority }> = [
    {
      title: `Apply ${category} standard to current outreach pipeline`,
      description: `Review upcoming client interactions and align with key takeaway: "${summary.slice(0, 80)}..."`,
      priority: "high",
    },
    {
      title: "Document standard template in studio playbooks",
      description: "Convert key principles into a reusable checklist item for the team.",
      priority: "medium",
    },
  ];

  const playbookDraft = {
    title: `${region.toUpperCase()} ${category.charAt(0).toUpperCase() + category.slice(1)} Standard Operating Procedure`,
    category,
    region,
    tags: [category, region, "sops", "agency-craft"],
    summary,
    content: [
      {
        id: "b1",
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: `${region.toUpperCase()} ${category.charAt(0).toUpperCase() + category.slice(1)} Standard` }],
      },
      {
        id: "b2",
        type: "paragraph",
        content: [{ type: "text", text: summary }],
      },
      {
        id: "b3",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Key Operating Principles" }],
      },
      ...insights.map((ins, i) => ({
        id: `b_ins_${i}`,
        type: "bulletListItem",
        content: [{ type: "text", text: `${ins.title}: ${ins.takeaway}` }],
      })),
    ],
  };

  return {
    summary,
    suggested_category: suggestedCategory,
    extracted_insights: insights,
    proposed_actions: proposedActions,
    playbook_draft: playbookDraft,
  };
}
