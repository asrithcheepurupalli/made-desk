"use server";

import { GoogleGenAI } from "@google/genai";
import type { Playbook, Client, Capture, NextAction, ActionPriority, MasterSop } from "@/lib/data/types";
import { blocksToMarkdown } from "@/lib/data/text";

export interface ChatMessage {
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

/** The workspace the browser sends along, since the server stores nothing. */
export interface WorkspaceSnapshot {
  playbooks: Playbook[];
  clients: Client[];
  captures: Capture[];
  actions: NextAction[];
  masters?: MasterSop[];
}

export async function askAssistantServerAction(
  history: ChatMessage[],
  userPrompt: string,
  snapshot: WorkspaceSnapshot
): Promise<AssistantResponse> {
  if (!userPrompt || userPrompt.trim().length === 0) {
    return {
      content: "Please provide a query for the studio assistant.",
      citedSources: [],
    };
  }

  try {
    const { playbooks, clients, captures, actions } = snapshot;
    const masters = snapshot.masters || [];
    const mergedIds = new Set(masters.flatMap((m) => m.source_playbook_ids));
    const mastersContext = masters
      .map((m) => `[MASTER SOP: ${m.title}] (Slug: ${m.slug}, merged from ${m.source_playbook_ids.length} SOPs)\n${blocksToMarkdown(m.content)}`)
      .join("\n\n---\n\n");

    // Format Playbooks
    const playbooksContext = playbooks
      .filter((p) => !mergedIds.has(p.id))
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
   - For master SOPs: [Master Title](/masters/slug)
   - For playbooks: [Playbook Title](/playbooks/slug)
   - For clients: [Client Name](/clients/slug)
   - For actions: [Next Actions Board](/actions)
4. HARD STYLE RULE: Never use em dashes (—) or en dashes (–). Use commas, colons, parentheses, or clean periods instead.
5. Keep answers tactical, dense, clear, and immediately actionable for our founders and designers.
6. When outlining step-by-step procedures, use numbered or bulleted lists so our founders can immediately execute them or convert them into a living Playbook SOP.

=== MASTER SOPS (canonical, merged from overlapping SOPs: prefer these) ===
${mastersContext || "None yet."}

=== OTHER STUDIO PLAYBOOKS & SOPS ===
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
