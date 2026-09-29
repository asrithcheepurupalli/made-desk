import { GoogleGenAI } from "@google/genai";
import { hasGemini } from "@/lib/env";
import { EXTRACTION_SYSTEM_PROMPT, ASSISTANT_SYSTEM_PROMPT } from "./prompts";
import { mockExtractFromText, type ExtractionResult } from "./mock";
import type { Playbook, Client, NextAction, CitedSource } from "@/lib/data/types";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function extractInsightsWithGemini(
  rawText: string,
  sourceUrl?: string,
  quality: "full" | "caption_only" | "manual" = "manual"
): Promise<ExtractionResult> {
  if (quality === "caption_only") {
    // Nothing real to analyse: never let a model pad a caption into fake insights.
    return captionOnlyResult(rawText);
  }

  const ai = getGeminiClient();
  if (!ai || !hasGemini()) {
    return mockExtractFromText(rawText, sourceUrl);
  }

  try {
    const userPrompt = `
Analyze this captured reel transcript / note:

SOURCE URL: ${sourceUrl || "None"}
SOURCE QUALITY: ${quality}
CONTENT:
"""
${rawText}
"""

Extract structured operational insights, category, proposed next actions, and playbook draft following the JSON schema.
Return valid JSON only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: EXTRACTION_SYSTEM_PROMPT }, { text: userPrompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      return mockExtractFromText(rawText, sourceUrl);
    }

    const parsed = JSON.parse(responseText) as ExtractionResult;
    return parsed;
  } catch (error) {
    console.error("Gemini extraction error, falling back to mock:", error);
    return mockExtractFromText(rawText, sourceUrl);
  }
}

export interface GroundedAssistantResponse {
  content: string;
  cited_sources: CitedSource[];
}

export async function queryGroundedAssistant(params: {
  question: string;
  playbooks: Playbook[];
  clients: Client[];
  actions: NextAction[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<GroundedAssistantResponse> {
  const { question, playbooks, clients, actions, history } = params;
  const ai = getGeminiClient();

  // Prepare grounded context
  const contextSections = [
    "=== AGENCY PLAYBOOKS & SOPS ===",
    ...playbooks.map(
      (p) => `PLAYBOOK: [ID: ${p.id}] [SLUG: ${p.slug}] [CATEGORY: ${p.category}] [REGION: ${p.region}]
Title: ${p.title}
Summary: ${p.summary || "N/A"}
Tags: ${p.tags.join(", ")}
Content: ${JSON.stringify(p.content).slice(0, 2000)}`
    ),
    "\n=== ACTIVE CLIENTS & ONBOARDING ===",
    ...clients.map(
      (c) => `CLIENT: [ID: ${c.id}] [SLUG: ${c.slug}] [STAGE: ${c.stage}] [REGION: ${c.region}]
Name: ${c.name} (${c.company || "No company name"})
Contact: ${JSON.stringify(c.contact_info)}
Onboarding Checklist: ${JSON.stringify(c.onboarding_checklist)}
Notes: ${JSON.stringify(c.content).slice(0, 1000)}`
    ),
    "\n=== OPEN NEXT ACTIONS ===",
    ...actions.slice(0, 20).map(
      (a) => `ACTION: [ID: ${a.id}] [PRIORITY: ${a.priority}] [STATUS: ${a.status}]
Title: ${a.title}
Description: ${a.description || "N/A"}
Linked Client: ${a.linked_client_id || "None"}
Linked Playbook: ${a.linked_playbook_id || "None"}`
    ),
  ].join("\n\n");

  if (!ai || !hasGemini()) {
    // Zero-config intelligent fallback
    const qLower = question.toLowerCase();
    const citedSources: CitedSource[] = [];

    let matchedPlaybook = playbooks.find(
      (p) =>
        qLower.includes(p.slug) ||
        qLower.includes(p.category) ||
        (p.region !== "global" && qLower.includes(p.region))
    );

    let matchedClient = clients.find(
      (c) => qLower.includes(c.name.toLowerCase()) || qLower.includes(c.slug)
    );

    if (matchedPlaybook) {
      citedSources.push({
        type: "playbook",
        id: matchedPlaybook.id,
        title: matchedPlaybook.title,
        slug: matchedPlaybook.slug,
      });
    }

    if (matchedClient) {
      citedSources.push({
        type: "client",
        id: matchedClient.id,
        title: matchedClient.name,
        slug: matchedClient.slug,
      });
    }

    if (qLower.includes("uae") || qLower.includes("dubai") || qLower.includes("gulf")) {
      const pb = playbooks.find((p) => p.slug === "uae-client-acquisition");
      if (pb && !citedSources.some((s) => s.id === pb.id)) {
        citedSources.push({
          type: "playbook",
          id: pb.id,
          title: pb.title,
          slug: pb.slug,
        });
      }
      return {
        content: `According to our **UAE & Gulf Client Acquisition Playbook**, outreach in Dubai and Abu Dhabi follows specific relationship-first standards:

1. **The WhatsApp Voice Note Rule**: Keep the opening text message to under 3 sentences, immediately paired with a crisp 30 to 45 second voice note identifying one concrete UX bottleneck and offering a zero-friction fix.
2. **Pricing Structure**: Quote in AED or USD. Avoid vague hourly rates, always present fixed deliverables or retainer tiers.
3. **Weekly Schedule**: Sunday to Thursday are prime working days. Friday mornings are strictly off; reach out Friday late afternoon or Sunday morning.
4. **Trust Markers**: Reference tactile luxury craft and past live platforms (such as VANE or restaurant QR platforms).`,
        cited_sources: citedSources,
      };
    }

    if (qLower.includes("onboard") || qLower.includes("checklist") || qLower.includes("first 48")) {
      const pb = playbooks.find((p) => p.slug === "client-onboarding-protocol");
      if (pb && !citedSources.some((s) => s.id === pb.id)) {
        citedSources.push({
          type: "playbook",
          id: pb.id,
          title: pb.title,
          slug: pb.slug,
        });
      }
      return {
        content: `According to our **made. 48-Hour Client Onboarding Protocol**, here is our immediate sequence after invoice clearance:

1. **Within 2 Hours**: Create a dedicated WhatsApp group or shared Slack channel with the client team and send the milestone welcome schedule.
2. **Within 24 Hours**: Request required brand assets, Figma team invites, domain/hosting credentials, vector logos (.svg/.ai), typography licenses, and raw photography.
3. **Within 48 Hours**: Deliver the interactive prototype staging link or kickoff design alignment deck.`,
        cited_sources: citedSources,
      };
    }

    if (matchedClient) {
      return {
        content: `Here is the current operational status for **${matchedClient.name}** (${matchedClient.company || "Direct account"}):

- **Stage**: ${matchedClient.stage.toUpperCase()}
- **Region**: ${matchedClient.region.toUpperCase()}
- **Contact**: ${matchedClient.contact_info.email || matchedClient.contact_info.whatsapp || "None listed"}
- **Checklist Progress**: ${matchedClient.onboarding_checklist.filter((i) => i.completed).length} / ${matchedClient.onboarding_checklist.length} items completed.

Next pending item: ${matchedClient.onboarding_checklist.find((i) => !i.completed)?.task || "All milestone checklist items completed."}`,
        cited_sources: citedSources,
      };
    }

    return {
      content: `We have reviewed our agency playbooks (${playbooks.length} active), client accounts (${clients.length} active), and open action queue.

For "${question}", please refer to the relevant playbook in the sidebar or record a new capture from your research to build this SOP into our desk.`,
      cited_sources: citedSources,
    };
  }

  try {
    const prompt = `
GROUNDED CONTEXT:
${contextSections}

CONVERSATION HISTORY:
${history.map((h) => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}

USER QUESTION:
${question}

Provide a factual response grounded in the agency data above. If citing a playbook or client, include their exact title and slug.
At the end of your response, output a JSON block on a new line with cited sources:
<!-- SOURCES: [{"type": "playbook"|"client"|"action", "id": "...", "title": "...", "slug": "..."}] -->
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: ASSISTANT_SYSTEM_PROMPT }, { text: prompt }],
        },
      ],
      config: {
        temperature: 0.3,
      },
    });

    const fullText = response.text || "";
    let citedSources: CitedSource[] = [];
    let cleanContent = fullText;

    const sourceMatch = fullText.match(/<!-- SOURCES:\s*(\[[\s\S]*?\])\s*-->/);
    if (sourceMatch && sourceMatch[1]) {
      try {
        citedSources = JSON.parse(sourceMatch[1]);
        cleanContent = fullText.replace(/<!-- SOURCES:[\s\S]*?-->/g, "").trim();
      } catch {}
    }

    // Auto-detect cited playbooks if not extracted in JSON block
    if (citedSources.length === 0) {
      for (const pb of playbooks) {
        if (cleanContent.includes(pb.title) || cleanContent.includes(pb.slug)) {
          citedSources.push({
            type: "playbook",
            id: pb.id,
            title: pb.title,
            slug: pb.slug,
          });
        }
      }
      for (const cl of clients) {
        if (cleanContent.includes(cl.name) || cleanContent.includes(cl.slug)) {
          citedSources.push({
            type: "client",
            id: cl.id,
            title: cl.name,
            slug: cl.slug,
          });
        }
      }
    }

    return {
      content: cleanContent,
      cited_sources: citedSources,
    };
  } catch (error) {
    console.error("Gemini assistant query error:", error);
    return {
      content: "An error occurred while querying our agency records with Gemini. Please check your API key or query directly from the playbooks.",
      cited_sources: [],
    };
  }
}


function captionOnlyResult(caption: string): ExtractionResult {
  const clean = caption.replace(/^CAPTION:\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 300);
  return {
    summary: `Caption only: ${clean || "no caption text"}. The video itself was not transcribed, so no insights were extracted.`,
    suggested_category: "general",
    extracted_insights: [],
    proposed_actions: [
      {
        title: "Watch the reel and paste the key points as a note",
        description: "We could only read the caption, not the spoken content. Add the real steps by hand so they can become an SOP.",
        priority: "medium",
      },
    ],
  };
}
