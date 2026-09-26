"use server";

import { revalidatePath } from "next/cache";
import { listPlaybooks, createPlaybook } from "@/lib/data/playbooks";
import { listClients, createClient } from "@/lib/data/clients";
import { listCaptures } from "@/lib/data/captures";
import { listNextActions, createNextAction } from "@/lib/data/actions";
import { GoogleGenAI } from "@google/genai";
import type { PlaybookCategory, Region, ActionPriority } from "@/lib/data/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantSource {
  type: "playbook" | "client" | "action" | "capture";
  title: string;
  url: string;
}

export interface AssistantResponse {
  content: string;
  citedSources: AssistantSource[];
  suggestedSopTitle?: string;
  extractedTasks?: Array<{ title: string; priority: ActionPriority }>;
  error?: string;
}

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
  if (!userPrompt || userPrompt.trim().length === 0) {
    return {
      content: "Please provide a query for the studio assistant.",
      citedSources: [],
    };
  }

  try {
    const [playbooks, clients, captures, actions] = await Promise.all([
      listPlaybooks(),
      listClients(),
      listCaptures(),
      listNextActions(),
    ]);

    // Format Playbooks
    const playbooksContext = playbooks
      .map((p) => {
        const textContent = Array.isArray(p.content)
          ? p.content
              .map((b: any) => {
                if (b.text) return b.text;
                if (b.props?.text) return b.props.text;
                if (Array.isArray(b.content)) {
                  return b.content.map((c: any) => c.text || "").join(" ");
                }
                return "";
              })
              .filter(Boolean)
              .join("\n")
          : "";

        return `[PLAYBOOK: ${p.title}] (Slug: ${p.slug}, Category: ${p.category.toUpperCase()}, Region: ${p.region?.toUpperCase() || "GLOBAL"})\nSummary: ${p.summary || "No summary"}\nContent:\n${textContent}`;
      })
      .join("\n\n---\n\n");

    // Format Clients
    const clientsContext = clients
      .map((c) => {
        const checklistStr = c.onboarding_checklist
          ?.map((i) => `  - [${i.completed ? "DONE" : "PENDING"}] ${i.task}`)
          .join("\n");

        return `[CLIENT: ${c.company || c.name}] (Slug: ${c.slug}, Stage: ${c.stage.toUpperCase()}, Region: ${c.region?.toUpperCase() || "GLOBAL"})\nContact: ${c.name} (${c.contact_info?.role || "Contact"}), Email: ${c.contact_info?.email || "N/A"}, WhatsApp: ${c.contact_info?.whatsapp || "N/A"}\nOnboarding Checklist:\n${checklistStr || "  No checklist items"}`;
      })
      .join("\n\n---\n\n");

    // Format Captures
    const capturesContext = captures
      .slice(0, 10)
      .map((cap) => {
        const takeaways = Array.isArray(cap.extracted_insights)
          ? cap.extracted_insights
              .map((i: any) => (typeof i === "string" ? i : i.takeaway || i.title))
              .filter(Boolean)
              .join("; ")
          : "";
        return `[CAPTURE: ${cap.source_type.toUpperCase()}] ${cap.summary || cap.raw_text.slice(0, 150)}\nTakeaways: ${takeaways}`;
      })
      .join("\n\n");

    // Format Actions
    const actionsContext = actions
      .slice(0, 15)
      .map((a) => `[TASK (${a.priority.toUpperCase()} - ${a.status.toUpperCase()})] ${a.title}`)
      .join("\n");

    const systemPrompt = `You are the internal operational intelligence assistant for the design & product agency "made. by ac" (made. desk).
You have access to the studio's exact playbooks, SOPs, client workspaces, onboarding milestones, reel transcripts, and next actions.

STRICT OPERATIONAL GUIDELINES:
1. Always speak as our studio agency team: use "we", "our studio", "our team", never use "I".
2. Answer questions grounded in the provided agency knowledge base below.
3. If an answer draws upon a playbook or client, explicitly cite them as markdown links:
   - For playbooks: [Playbook Title](/playbooks/slug)
   - For clients: [Client Name](/clients/slug)
   - For actions: [Next Actions Board](/actions)
4. HARD STYLE RULE: Never use em dashes (—) or en dashes (–). Use commas, colons, parentheses, or clean periods instead.
5. Keep answers tactical, dense, clear, and immediately actionable for our founders and designers.
6. When outlining step-by-step procedures, use numbered or bulleted lists so our founders can immediately execute them or convert them into a living Playbook SOP.

=== STUDIO PLAYBOOKS & SOPS ===
${playbooksContext}

=== ACTIVE CLIENT WORKSPACES ===
${clientsContext}

=== RECENT CAPTURES & REEL TACTICS ===
${capturesContext}

=== STUDIO NEXT ACTIONS ===
${actionsContext}`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      // Deterministic fallback
      const relevantPlaybook = playbooks.find((p) =>
        userPrompt.toLowerCase().includes(p.category) ||
        userPrompt.toLowerCase().includes(p.slug) ||
        (p.region && userPrompt.toLowerCase().includes(p.region))
      ) || playbooks[0];

      let responseText = "";
      const citedSources: AssistantSource[] = [];

      if (relevantPlaybook) {
        responseText = `Based on our studio playbook [${relevantPlaybook.title}](/playbooks/${relevantPlaybook.slug}):\n\n${relevantPlaybook.summary || "Follow our established operational standards for client execution."}\n\nKey execution checklist:\n1. Verify client requirements and schedule kickoff milestones.\n2. Collect necessary brand assets and Figma team access.\n3. Execute communication guidelines and track in [Client Workspace](/clients).`;
        citedSources.push({
          type: "playbook",
          title: relevantPlaybook.title,
          url: `/playbooks/${relevantPlaybook.slug}`,
        });
      } else {
        responseText = `We have reviewed our studio knowledge base. For "${userPrompt}", we recommend establishing a dedicated SOP in [Playbooks](/playbooks) or logging pending milestones in [Next Actions](/actions).`;
      }

      return {
        content: responseText.replace(/—|–/g, ", "),
        citedSources,
        suggestedSopTitle: relevantPlaybook?.title || "Studio Operational Action Plan",
        extractedTasks: [
          { title: `Execute steps from ${relevantPlaybook?.title || "action plan"}`, priority: "high" },
          { title: "Review milestone deliverables with studio team", priority: "medium" },
        ],
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. We are the made. desk studio assistant. We will strictly answer from our studio's playbooks, client workspaces, captures, and next actions without using em dashes or marketing fluff." }],
      },
    ];

    for (const msg of history.slice(-6)) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        temperature: 0.2,
      },
    });

    let outputText = response.text || "We could not generate a response. Please check our studio records.";
    outputText = outputText.replace(/—/g, ", ").replace(/–/g, "-");

    // Detect citations
    const citedSources: AssistantSource[] = [];
    for (const p of playbooks) {
      if (outputText.includes(`/playbooks/${p.slug}`) || outputText.includes(p.title)) {
        if (!citedSources.some((s) => s.url === `/playbooks/${p.slug}`)) {
          citedSources.push({
            type: "playbook",
            title: p.title,
            url: `/playbooks/${p.slug}`,
          });
        }
      }
    }
    for (const c of clients) {
      if (outputText.includes(`/clients/${c.slug}`) || (c.company && outputText.includes(c.company))) {
        if (!citedSources.some((s) => s.url === `/clients/${c.slug}`)) {
          citedSources.push({
            type: "client",
            title: c.company || c.name,
            url: `/clients/${c.slug}`,
          });
        }
      }
    }

    // Extract potential tasks from response lines (look for numbered or bullet points)
    const taskCandidates: Array<{ title: string; priority: ActionPriority }> = [];
    const lines = outputText.split("\n");
    for (const line of lines) {
      const match = line.match(/^(\d+\.|\*|\-|\›)\s+(.+)/);
      if (match && match[2] && match[2].length > 10 && match[2].length < 120) {
        const cleanTask = match[2].replace(/\*\*/g, "").trim();
        taskCandidates.push({
          title: cleanTask,
          priority: "high",
        });
      }
    }

    return {
      content: outputText,
      citedSources,
      suggestedSopTitle: userPrompt.length < 50 ? userPrompt : userPrompt.slice(0, 50) + " SOP",
      extractedTasks: taskCandidates.slice(0, 4),
    };
  } catch (error) {
    console.error("Error in askAssistantAction:", error);
    return {
      content: "An error occurred while querying the studio assistant. Please verify our network connection.",
      citedSources: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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

    revalidatePath("/playbooks");
    revalidatePath("/dashboard");
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

    revalidatePath("/actions");
    revalidatePath("/dashboard");
    return { success: true, count: created.length };
  } catch (error: any) {
    console.error("Error adding tasks from assistant:", error);
    return { error: error?.message || "Failed to add tasks." };
  }
}
