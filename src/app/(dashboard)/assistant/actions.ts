import { listPlaybooks, createPlaybook } from "@/lib/data/playbooks";
import { listClients } from "@/lib/data/clients";
import { listCaptures } from "@/lib/data/captures";
import { listNextActions, createNextAction } from "@/lib/data/actions";
import { askAssistantServerAction } from "./ai";
import type { ChatMessage, AssistantResponse } from "./ai";
import type { PlaybookCategory, Region, ActionPriority } from "@/lib/data/types";

export type { ChatMessage, AssistantSource, AssistantResponse } from "./ai";

export async function getDynamicSuggestionsAction(): Promise<string[]> {
  const [playbooks, clients, actions, captures] = await Promise.all([
    listPlaybooks(),
    listClients(),
    listNextActions(),
    listCaptures(),
  ]);

  const suggestions: string[] = [];

  // 1. Playbook-specific questions
  playbooks.slice(0, 3).forEach((p) => {
    suggestions.push(`What are the key execution rules in our "${p.title}" playbook?`);
  });

  // 2. Client-specific questions
  clients.slice(0, 2).forEach((c) => {
    suggestions.push(`Summarize onboarding checklist and pending assets for ${c.company || c.name}.`);
  });

  // 3. Urgent actions
  const urgentCount = actions.filter((a) => a.status !== "done" && (a.priority === "urgent" || a.priority === "high")).length;
  if (urgentCount > 0) {
    suggestions.push(`What are our ${urgentCount} urgent next actions across the studio?`);
  }

  // 4. Recent captures
  if (captures.length > 0 && captures[0].summary) {
    const cleanCap = captures[0].summary.replace(/^Title:\s*/i, "").slice(0, 50);
    suggestions.push(`How do we apply our recent research on "${cleanCap}"?`);
  }

  // Fallbacks if workspace is blank
  if (suggestions.length === 0) {
    suggestions.push("How do we approach and structure cold outreach for high-ticket clients?");
    suggestions.push("What assets should we collect in our 48-hour client onboarding protocol?");
    suggestions.push("How should our studio structure monthly retainer pricing?");
  }

  return suggestions.slice(0, 5);
}

export async function askAssistantAction(
  history: ChatMessage[],
  userPrompt: string
): Promise<AssistantResponse> {
  const [playbooks, clients, captures, actions] = await Promise.all([
    listPlaybooks(),
    listClients(),
    listCaptures(),
    listNextActions(),
  ]);

  // Trim what we send: no screenshots, capped transcripts
  const slimCaptures = captures.slice(0, 10).map((c) => ({
    ...c,
    screenshots: undefined,
    raw_text: (c.raw_text || "").slice(0, 2000),
  }));

  return askAssistantServerAction(history, userPrompt, {
    playbooks,
    clients,
    captures: slimCaptures,
    actions: actions.slice(0, 30),
  });
}

/**
 * Superpower 1: Convert Assistant Response into an Editable Playbook SOP
 */
export async function createSOPFromAssistantAction(
  title: string,
  contentMarkdown: string,
  category: PlaybookCategory = "operations",
  region: Region = "global"
) {
  try {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    const slug = `${baseSlug || "sop"}-${Date.now().toString().slice(-4)}`;

    const lines = contentMarkdown.split("\n").filter((l) => l.trim().length > 0);
    const contentBlocks: any[] = [
      {
        id: `b-title-${Date.now()}`,
        type: "heading_1",
        text: title,
      },
    ];

    let currentHeading = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("###") || line.startsWith("##")) {
        contentBlocks.push({
          id: `b-h2-${Date.now()}-${i}`,
          type: "heading_2",
          text: line.replace(/^#+\s*/, ""),
        });
      } else if (line.match(/^(\d+\.|\*|\-|\›)\s+/)) {
        contentBlocks.push({
          id: `b-todo-${Date.now()}-${i}`,
          type: "todo",
          text: line.replace(/^(\d+\.|\*|\-|\›)\s+/, "").replace(/\*\*/g, ""),
          checked: false,
        });
      } else {
        contentBlocks.push({
          id: `b-p-${Date.now()}-${i}`,
          type: "paragraph",
          text: line,
        });
      }
    }

    const playbook = await createPlaybook({
      slug,
      title,
      category,
      region,
      tags: ["ai-generated", "assistant-derived", category],
      summary: lines[0] ? lines[0].slice(0, 150) : "Operational SOP derived from Studio AI Assistant.",
      content: contentBlocks,
    });

    return { success: true, slug: playbook.slug };
  } catch (error: any) {
    console.error("Error creating SOP from assistant:", error);
    return { error: error?.message || "Failed to create SOP." };
  }
}

/**
 * Superpower 2: Add Extracted Steps Directly to Next Actions
 */
export async function addTasksFromAssistantAction(
  tasks: Array<{ title: string; priority?: ActionPriority; description?: string }>
) {
  try {
    const created = [];
    for (const t of tasks) {
      const act = await createNextAction({
        title: t.title,
        description: t.description || "Generated via Studio AI Assistant action plan.",
        priority: t.priority || "high",
        status: "todo",
      });
      created.push(act);
    }

    return { success: true, count: created.length };
  } catch (error: any) {
    console.error("Error adding tasks from assistant:", error);
    return { error: error?.message || "Failed to add tasks." };
  }
}
