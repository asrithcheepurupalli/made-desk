#!/usr/bin/env tsx
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { listPlaybooks, getPlaybookBySlug, createPlaybook, updatePlaybook } from "../src/lib/data/playbooks.js";
import { listClients, getClientBySlug, createClient, updateClient } from "../src/lib/data/clients.js";
import { listNextActions, createNextAction, updateNextAction } from "../src/lib/data/actions.js";
import { listCaptures, createCapture, getCapture } from "../src/lib/data/captures.js";
import { extractInsightsWithGemini } from "../src/lib/ai/gemini.js";
import type { ClientStage, ActionPriority, ActionStatus, PlaybookCategory, Region } from "../src/lib/data/types.js";

const server = new Server(
  {
    name: "made-desk-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS: Tool[] = [
  {
    name: "desk_get_studio_context",
    description: "Get complete operational context of made. by ac agency including active playbooks, client pipeline, urgent next actions, and research captures.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "desk_list_playbooks",
    description: "List all made. agency playbooks, standard operating procedures, and outreach guides.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional filter by category: acquisition, onboarding, outreach, delivery, pricing, operations",
        },
        region: {
          type: "string",
          description: "Optional filter by region: uae, india, us, global",
        },
      },
    },
  },
  {
    name: "desk_get_playbook",
    description: "Get the full content, SOP steps, and guidelines of an agency playbook by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The playbook slug (e.g. uae-client-acquisition, client-onboarding-protocol)",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "desk_save_playbook",
    description: "Create or update an agency playbook SOP.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        category: { type: "string", enum: ["acquisition", "onboarding", "outreach", "delivery", "pricing", "operations"] },
        region: { type: "string", enum: ["uae", "india", "us", "global"] },
        summary: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        content: { type: "array", description: "Array of structured block notes" },
      },
      required: ["title", "category"],
    },
  },
  {
    name: "desk_list_clients",
    description: "List all active client accounts, pipeline stages, regions, and onboarding progress.",
    inputSchema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          description: "Optional filter: lead, proposal, onboarding, active, retained, archived",
        },
      },
    },
  },
  {
    name: "desk_get_client",
    description: "Get complete client profile, contact info, onboarding checklist, and workspace notes by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The client slug (e.g. al-reem-hospitality, novus-preventive-health)",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "desk_update_client_stage",
    description: "Update a client's pipeline stage (lead, proposal, onboarding, active, retained, archived).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        stage: { type: "string", enum: ["lead", "proposal", "onboarding", "active", "retained", "archived"] },
      },
      required: ["slug", "stage"],
    },
  },
  {
    name: "desk_toggle_checklist_item",
    description: "Toggle or mark an onboarding checklist item for a client.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        taskId: { type: "string" },
        completed: { type: "boolean" },
      },
      required: ["slug", "taskId", "completed"],
    },
  },
  {
    name: "desk_list_actions",
    description: "List prioritized next actions and tasks for the agency.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["todo", "in_progress", "done", "snoozed"] },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
      },
    },
  },
  {
    name: "desk_create_action",
    description: "Create a new prioritized next action for the studio.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
        description: { type: "string" },
        linkedClientId: { type: "string" },
        linkedPlaybookId: { type: "string" },
      },
      required: ["title"],
    },
  },
  {
    name: "desk_update_action_status",
    description: "Update the status of a next action (todo, in_progress, done, snoozed).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: ["todo", "in_progress", "done", "snoozed"] },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "desk_list_captures",
    description: "List raw and processed captures (reels, transcripts, articles) in the capture inbox.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "desk_add_capture",
    description: "Ingest a new reel transcript or web research note into made. desk with AI extraction.",
    inputSchema: {
      type: "object",
      properties: {
        rawText: { type: "string", description: "The transcript or research text" },
        sourceUrl: { type: "string", description: "Source URL (e.g. Instagram reel, YouTube link)" },
        sourceType: { type: "string", enum: ["reel", "youtube", "web", "note", "whatsapp"] },
      },
      required: ["rawText"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "desk_get_studio_context": {
        const [playbooks, clients, actions, captures] = await Promise.all([
          listPlaybooks(),
          listClients(),
          listNextActions(),
          listCaptures(),
        ]);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  studio: "made. by ac",
                  playbooks: playbooks.map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    category: p.category,
                    region: p.region,
                    summary: p.summary,
                  })),
                  clients: clients.map((c) => ({
                    slug: c.slug,
                    name: c.name,
                    company: c.company,
                    stage: c.stage,
                    region: c.region,
                    checklistProgress: `${c.onboarding_checklist.filter((i) => i.completed).length}/${c.onboarding_checklist.length}`,
                  })),
                  urgentActions: actions.filter((a) => a.status !== "done"),
                  recentCaptures: captures.slice(0, 5),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "desk_list_playbooks": {
        let playbooks = await listPlaybooks();
        if (args?.category) {
          playbooks = playbooks.filter((p) => p.category === args.category);
        }
        if (args?.region) {
          playbooks = playbooks.filter((p) => p.region === args.region);
        }
        return {
          content: [{ type: "text", text: JSON.stringify(playbooks, null, 2) }],
        };
      }

      case "desk_get_playbook": {
        const playbook = await getPlaybookBySlug(args?.slug as string);
        if (!playbook) {
          return { isError: true, content: [{ type: "text", text: `Playbook "${args?.slug}" not found.` }] };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(playbook, null, 2) }],
        };
      }

      case "desk_save_playbook": {
        const slug = (args?.slug as string) || (args?.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const existing = await getPlaybookBySlug(slug);
        let result;
        if (existing) {
          result = await updatePlaybook(slug, args as any);
        } else {
          result = await createPlaybook({
            slug,
            title: args?.title as string,
            category: (args?.category as PlaybookCategory) || "acquisition",
            region: (args?.region as Region) || "global",
            summary: args?.summary as string,
            tags: (args?.tags as string[]) || [args?.category as string],
            content: (args?.content as any[]) || [
              { id: "b1", type: "heading", props: { level: 1 }, content: [{ type: "text", text: args?.title as string }] },
            ],
          });
        }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "desk_list_clients": {
        let clients = await listClients();
        if (args?.stage) {
          clients = clients.filter((c) => c.stage === args.stage);
        }
        return {
          content: [{ type: "text", text: JSON.stringify(clients, null, 2) }],
        };
      }

      case "desk_get_client": {
        const client = await getClientBySlug(args?.slug as string);
        if (!client) {
          return { isError: true, content: [{ type: "text", text: `Client "${args?.slug}" not found.` }] };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(client, null, 2) }],
        };
      }

      case "desk_update_client_stage": {
        const updated = await updateClient(args?.slug as string, { stage: args?.stage as ClientStage });
        return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
      }

      case "desk_toggle_checklist_item": {
        const client = await getClientBySlug(args?.slug as string);
        if (!client) {
          return { isError: true, content: [{ type: "text", text: `Client "${args?.slug}" not found.` }] };
        }
        const checklist = client.onboarding_checklist.map((item) => {
          if (item.id === args?.taskId) {
            return {
              ...item,
              completed: Boolean(args?.completed),
              sent_at: args?.completed ? new Date().toISOString() : undefined,
            };
          }
          return item;
        });
        const updated = await updateClient(client.slug, { onboarding_checklist: checklist });
        return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
      }

      case "desk_list_actions": {
        let actions = await listNextActions();
        if (args?.status) {
          actions = actions.filter((a) => a.status === args.status);
        }
        if (args?.priority) {
          actions = actions.filter((a) => a.priority === args.priority);
        }
        return {
          content: [{ type: "text", text: JSON.stringify(actions, null, 2) }],
        };
      }

      case "desk_create_action": {
        const action = await createNextAction({
          title: args?.title as string,
          description: args?.description as string,
          priority: (args?.priority as ActionPriority) || "medium",
          status: "todo",
          linked_client_id: args?.linkedClientId as string,
          linked_playbook_id: args?.linkedPlaybookId as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(action, null, 2) }] };
      }

      case "desk_update_action_status": {
        const updated = await updateNextAction(args?.id as string, { status: args?.status as ActionStatus });
        return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
      }

      case "desk_list_captures": {
        const captures = await listCaptures();
        return {
          content: [{ type: "text", text: JSON.stringify(captures, null, 2) }],
        };
      }

      case "desk_add_capture": {
        const rawText = args?.rawText as string;
        const sourceUrl = args?.sourceUrl as string;
        const extraction = await extractInsightsWithGemini(rawText, sourceUrl);
        const capture = await createCapture({
          raw_text: rawText,
          source_url: sourceUrl,
          source_type: (args?.sourceType as any) || "reel",
          status: "processed",
          summary: extraction.summary,
          extracted_insights: extraction.extracted_insights,
          suggested_category: extraction.suggested_category,
          processed_at: new Date().toISOString(),
        });

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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  capture,
                  extraction,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message || String(error) }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
