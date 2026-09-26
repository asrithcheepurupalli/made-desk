"use server";

import { listPlaybooks } from "@/lib/data/playbooks";
import { listClients } from "@/lib/data/clients";
import { listCaptures } from "@/lib/data/captures";
import { listNextActions } from "@/lib/data/actions";
import { GoogleGenAI } from "@google/genai";

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
  error?: string;
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
    // 1. Fetch entire agency operational knowledge base for zero-loss grounding
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

    const systemPrompt = `You are the internal operational intelligence assistant for the design and product agency "made. by ac" (made. desk).
You have access to the studio's exact playbooks, SOPs, client workspaces, onboarding milestones, reel transcripts, and next actions.

STRICT OPERATIONAL GUIDELINES:
1. Always speak as our studio agency team: use "we", "our studio", "our team", never use "I".
2. Answer questions grounded in the provided agency knowledge base below.
3. If an answer draws upon a playbook or client, explicitly cite them as markdown links:
   - For playbooks: [Playbook Title](/playbooks/slug)
   - For clients: [Client Name](/clients/slug)
   - For actions: [Next Actions Board](/actions)
4. HARD STYLE RULE: Never use em dashes (—) or en dashes (–). Use commas, colons, parentheses, or clean periods instead.
5. Keep answers tactical, dense, clear, and immediately actionable for our founders and designers. Avoid marketing fluff or wordy preambles.

=== STUDIO PLAYBOOKS & SOPS ===
${playbooksContext}

=== ACTIVE CLIENT WORKSPACES ===
${clientsContext}

=== RECENT CAPTURES & REEL TACTICS ===
${capturesContext}

=== STUDIO NEXT ACTIONS ===
${actionsContext}`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback deterministic response for zero-config mode
      const relevantPlaybook = playbooks.find((p) =>
        userPrompt.toLowerCase().includes(p.category) ||
        userPrompt.toLowerCase().includes(p.slug) ||
        (p.region && userPrompt.toLowerCase().includes(p.region))
      ) || playbooks[0];

      const relevantClient = clients.find((c) =>
        (c.company && userPrompt.toLowerCase().includes(c.company.toLowerCase())) ||
        userPrompt.toLowerCase().includes(c.name.toLowerCase())
      );

      let responseText = "";
      const citedSources: AssistantSource[] = [];

      if (userPrompt.toLowerCase().includes("uae") || userPrompt.toLowerCase().includes("dubai")) {
        const uaePlaybook = playbooks.find((p) => p.region === "uae") || relevantPlaybook;
        responseText = `For UAE enterprise prospects, our standard protocol is established in [${uaePlaybook.title}](/playbooks/${uaePlaybook.slug}).\n\nKey execution rules for the UAE region:\n1. Communication channel: Initial outreach via LinkedIn or mutual introduction, then promptly transition to direct WhatsApp voice notes once acknowledged.\n2. In-person presence: Emphasize local UAE presence or scheduled quarterly visits to Dubai and Abu Dhabi.\n3. Pre-onboarding: Send our curated capability deck and localized pricing in AED prior to scheduling a formal pitch.\n4. Follow-up: Follow up within 24 to 48 hours directly via WhatsApp with concise bullet points.`;
        if (uaePlaybook) {
          citedSources.push({
            type: "playbook",
            title: uaePlaybook.title,
            url: `/playbooks/${uaePlaybook.slug}`,
          });
        }
      } else if (userPrompt.toLowerCase().includes("onboard") || userPrompt.toLowerCase().includes("checklist")) {
        const onboardingPlaybook = playbooks.find((p) => p.category === "onboarding") || relevantPlaybook;
        responseText = `Our standard client onboarding workflow follows [${onboardingPlaybook.title}](/playbooks/${onboardingPlaybook.slug}):\n\n1. Dispatch Agency Capability Deck and Scope Brief.\n2. Collect brand identity assets, font files, brand guidelines, and Figma project access.\n3. Execute mutual Non-Disclosure Agreement and Master Services Agreement.\n4. Initialize dedicated WhatsApp communication channel with client leadership.\n5. Send Retainer Invoice #1 and confirm payment receipt.\n\nYou can track active client onboarding checklists in the [Client Workspace](/clients).`;
        if (onboardingPlaybook) {
          citedSources.push({
            type: "playbook",
            title: onboardingPlaybook.title,
            url: `/playbooks/${onboardingPlaybook.slug}`,
          });
        }
      } else {
        responseText = `Based on our studio documentation, we manage our processes through dedicated SOPs in [Playbooks](/playbooks) and active accounts in [Client Workspace](/clients).\n\nKey reference: [${relevantPlaybook.title}](/playbooks/${relevantPlaybook.slug}):\n${relevantPlaybook.summary || "Follow standard studio guidelines for execution."}\n\nTo see pending tasks related to this, review our [Next Actions Board](/actions).`;
        if (relevantPlaybook) {
          citedSources.push({
            type: "playbook",
            title: relevantPlaybook.title,
            url: `/playbooks/${relevantPlaybook.slug}`,
          });
        }
      }

      if (relevantClient) {
        citedSources.push({
          type: "client",
          title: relevantClient.company || relevantClient.name,
          url: `/clients/${relevantClient.slug}`,
        });
      }

      return {
        content: responseText.replace(/—|–/g, ", "),
        citedSources,
      };
    }

    // Call Gemini Free Tier
    const ai = new GoogleGenAI({ apiKey });

    // Build conversation
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
    });

    let outputText = response.text || "We could not generate a response. Please check our studio records.";
    // Clean any accidental em/en dashes
    outputText = outputText.replace(/—/g, ", ").replace(/–/g, "-");

    // Detect citations from playbooks and clients
    const citedSources: AssistantSource[] = [];
    for (const p of playbooks) {
      if (outputText.includes(`/playbooks/${p.slug}`) || outputText.includes(p.title)) {
        citedSources.push({
          type: "playbook",
          title: p.title,
          url: `/playbooks/${p.slug}`,
        });
      }
    }
    for (const c of clients) {
      if (outputText.includes(`/clients/${c.slug}`) || (c.company && outputText.includes(c.company))) {
        citedSources.push({
          type: "client",
          title: c.company || c.name,
          url: `/clients/${c.slug}`,
        });
      }
    }

    return {
      content: outputText,
      citedSources,
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
