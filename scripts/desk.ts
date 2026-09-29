#!/usr/bin/env tsx
import { listPlaybooks, getPlaybookBySlug, createPlaybook, updatePlaybook } from "../src/lib/data/playbooks";
import { listClients, getClientBySlug, createClient, updateClient } from "../src/lib/data/clients";
import { listNextActions, createNextAction, updateNextAction } from "../src/lib/data/actions";
import { listCaptures, createCapture, updateCapture, getCapture } from "../src/lib/data/captures";
import { buildStudioContext } from "../src/lib/data/context";
import { playbookToMarkdown, clientToMarkdown, blocksToMarkdown } from "../src/lib/data/text";
import { freshnessHeader, WRITE_WARNING } from "./lib";
import fs from "node:fs";
import path from "node:path";
import { extractInsightsWithGemini } from "../src/lib/ai/gemini";
import { extractMediaFromUrl } from "../src/lib/media/extractor";
import type { ClientStage, ActionPriority, ActionStatus, PlaybookCategory, Region, SourceType } from "../src/lib/data/types";

const [,, command, subcommand, ...args] = process.argv;

async function printStudioContext() {
  const brief = [subcommand, ...args].includes("--brief");
  console.log(await buildStudioContext({ full: !brief, header: freshnessHeader() }));
}

async function searchStudio() {
  const term = [subcommand, ...args].filter((x) => !x.startsWith("--")).join(" ").toLowerCase().trim();
  if (!term) {
    console.error('Usage: desk search "<words>"');
    process.exit(1);
  }
  const [playbooks, clients, captures] = await Promise.all([listPlaybooks(), listClients(), listCaptures()]);
  const hits: string[] = [];
  for (const p of playbooks) {
    const text = `${p.title}\n${p.summary || ""}\n${blocksToMarkdown(p.content)}`;
    const lines = text.split("\n").filter((l) => l.toLowerCase().includes(term));
    if (lines.length) hits.push(`PLAYBOOK ${p.title} (${p.slug})\n${lines.slice(0, 5).map((l) => "  " + l.trim().slice(0, 200)).join("\n")}`);
  }
  for (const c of clients) {
    const text = clientToMarkdown(c);
    const lines = text.split("\n").filter((l) => l.toLowerCase().includes(term));
    if (lines.length) hits.push(`CLIENT ${c.company || c.name} (${c.slug})\n${lines.slice(0, 3).map((l) => "  " + l.trim().slice(0, 200)).join("\n")}`);
  }
  for (const c of captures) {
    if (`${c.summary || ""} ${c.raw_text}`.toLowerCase().includes(term)) hits.push(`CAPTURE ${c.source_url || c.source_type}: ${(c.summary || c.raw_text).slice(0, 160)}`);
  }
  console.log(hits.length ? hits.join("\n\n") : `No matches for "${term}".`);
}

async function importBackup() {
  const file = subcommand;
  if (!file) {
    console.error("Usage: desk import <made-desk-backup.json>   (from the app's Export button)");
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (parsed?.app !== "made-desk" || typeof parsed.data !== "object") {
    console.error("That is not a made. desk backup file.");
    process.exit(1);
  }
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const [name, rows] of Object.entries<any>(parsed.data)) {
    if (!Array.isArray(rows)) continue;
    const slim = name === "captures.json" ? rows.map((r: any) => ({ ...r, screenshots: undefined })) : rows;
    fs.writeFileSync(path.join(dir, name), JSON.stringify(slim, null, 2));
    n += rows.length;
  }
  console.log(`Imported ${n} records into .data/`);
}

async function handlePlaybooks() {
  if (!subcommand || subcommand === "list") {
    const playbooks = await listPlaybooks();
    console.table(
      playbooks.map((p) => ({
        slug: p.slug,
        title: p.title,
        category: p.category,
        region: p.region,
        tags: p.tags.join(", "),
      }))
    );
  } else if (subcommand === "get") {
    const slug = args[0];
    if (!slug) {
      console.error("Error: Please provide a playbook slug. Example: desk playbooks get uae-client-acquisition");
      process.exit(1);
    }
    const playbook = await getPlaybookBySlug(slug);
    if (!playbook) {
      console.error(`Playbook "${slug}" not found.`);
      process.exit(1);
    }
    console.log(args.includes("--json") ? JSON.stringify(playbook, null, 2) : playbookToMarkdown(playbook));
  } else if (subcommand === "create") {
    const title = args[0];
    const category = (args[1] as PlaybookCategory) || "acquisition";
    const region = (args[2] as Region) || "global";
    if (!title) {
      console.error("Error: Please provide a playbook title.");
      process.exit(1);
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const playbook = await createPlaybook({
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      title,
      category,
      region,
      tags: [category, region],
      content: [
        {
          id: "b1",
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text", text: title }],
        },
      ],
      summary: `Standard operational procedure for ${title}.`,
    });
    console.log(`Created playbook: ${playbook.slug}`);
  }
}

async function handleClients() {
  if (!subcommand || subcommand === "list") {
    const clients = await listClients();
    console.table(
      clients.map((c) => ({
        slug: c.slug,
        name: c.name,
        company: c.company || "N/A",
        stage: c.stage,
        region: c.region,
        checklist_progress: `${c.onboarding_checklist.filter((i) => i.completed).length}/${c.onboarding_checklist.length}`,
      }))
    );
  } else if (subcommand === "get") {
    const slug = args[0];
    if (!slug) {
      console.error("Error: Please provide a client slug. Example: desk clients get al-reem-hospitality");
      process.exit(1);
    }
    const client = await getClientBySlug(slug);
    if (!client) {
      console.error(`Client "${slug}" not found.`);
      process.exit(1);
    }
    console.log(JSON.stringify(client, null, 2));
  } else if (subcommand === "update-stage") {
    const [slugOrId, newStage] = args;
    if (!slugOrId || !newStage) {
      console.error("Usage: desk clients update-stage <slug> <lead|proposal|onboarding|active|retained|archived>");
      process.exit(1);
    }
    const updated = await updateClient(slugOrId, { stage: newStage as ClientStage });
    console.log(`Updated client ${updated?.slug} stage to ${newStage}`);
  }
}

async function handleActions() {
  if (!subcommand || subcommand === "list") {
    const actions = await listNextActions();
    console.table(
      actions.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        priority: a.priority,
        linked_client: a.linked_client_id || "None",
      }))
    );
  } else if (subcommand === "create") {
    const title = args[0];
    const priority = (args[1] as ActionPriority) || "medium";
    const description = args[2];
    if (!title) {
      console.error("Usage: desk actions create <title> [priority] [description]");
      process.exit(1);
    }
    const action = await createNextAction({
      title,
      priority,
      description,
      status: "todo",
    });
    console.log(`Created action [${action.priority.toUpperCase()}]: ${action.title} (ID: ${action.id})`);
  } else if (subcommand === "toggle") {
    const [id, newStatus] = args;
    if (!id || !newStatus) {
      console.error("Usage: desk actions toggle <id> <todo|in_progress|done|snoozed>");
      process.exit(1);
    }
    const updated = await updateNextAction(id, { status: newStatus as ActionStatus });
    console.log(`Updated action ${id} to ${updated?.status}`);
  }
}

async function handleCaptures() {
  if (!subcommand || subcommand === "list") {
    const captures = await listCaptures();
    console.table(
      captures.map((c) => ({
        id: c.id,
        source: c.source_type,
        status: c.status,
        summary: c.summary?.slice(0, 45) || c.raw_text.slice(0, 45) + "...",
        insights_count: c.extracted_insights.length,
      }))
    );
  } else if (subcommand === "add") {
    const input = args[0];
    let sourceUrl = args[1];
    if (!input) {
      console.error("Usage: desk captures add <url_or_raw_transcript> [source_url]");
      process.exit(1);
    }

    const isUrl =
      input.startsWith("http://") ||
      input.startsWith("https://") ||
      input.includes("instagram.com") ||
      input.includes("youtube.com") ||
      input.includes("youtu.be");

    if (isUrl && !sourceUrl) {
      sourceUrl = input;
    }

    const sourceType: SourceType = sourceUrl?.includes("youtube")
      ? "youtube"
      : sourceUrl?.includes("instagram")
      ? "reel"
      : isUrl
      ? "web"
      : "note";

    console.log(`[made. desk] Ingesting capture... (Type: ${sourceType})`);

    const capture = await createCapture({
      raw_text: isUrl ? `[Auto Ingestion for ${sourceUrl}]` : input,
      source_url: sourceUrl,
      source_type: sourceType,
      status: "pending",
      extracted_insights: [],
    });

    let effectiveTranscript = isUrl ? "" : input;
    let screenshots: string[] = [];
    let durationSeconds: number | undefined = undefined;

    if (sourceUrl && (sourceType === "reel" || sourceType === "youtube")) {
      console.log(`[made. desk] Extracting media & transcribing audio with yt-dlp + ffmpeg + Gemini...`);
      try {
        const media = await extractMediaFromUrl(sourceUrl, capture.id);
        if (media.transcript && media.transcript.trim().length > 0) {
          effectiveTranscript = media.transcript;
        }
        if (media.screenshots && media.screenshots.length > 0) {
          screenshots = media.screenshots;
        }
        if (media.durationSeconds) {
          durationSeconds = media.durationSeconds;
        }
      } catch (err: any) {
        console.warn(`[made. desk] Media extraction warning:`, err.message);
      }
    }

    console.log(`[made. desk] Running structured extraction with Gemini...`);
    const extraction = await extractInsightsWithGemini(
      effectiveTranscript || input || `Content from ${sourceUrl}`,
      sourceUrl
    );

    await updateCapture(capture.id, {
      raw_text: effectiveTranscript || input,
      status: "processed",
      summary: extraction.summary,
      extracted_insights: extraction.extracted_insights,
      suggested_category: extraction.suggested_category,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      duration_seconds: durationSeconds,
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

    console.log(`\n✓ Capture processed successfully! (ID: ${capture.id})`);
    console.log(`Summary: ${extraction.summary}`);
    console.log(`Key Takeaways: ${extraction.extracted_insights?.length || 0}`);
    if (screenshots.length > 0) {
      console.log(`Screenshots Extracted: ${screenshots.length} keyframes saved to public/captures/${capture.id}/`);
    }
    console.log(`Created Next Actions: ${extraction.proposed_actions?.length || 0}`);
  }
}

async function main() {
  switch (command) {
    case "context":
    case "summary":
      await printStudioContext();
      break;
    case "search":
      await searchStudio();
      break;
    case "import":
      await importBackup();
      break;
    case "playbooks":
      await handlePlaybooks();
      break;
    case "clients":
      await handleClients();
      break;
    case "actions":
      await handleActions();
      break;
    case "captures":
      await handleCaptures();
      break;
    default:
      console.log(`
made. desk CLI: Direct agency knowledge and operational control

Usage:
  desk context [--brief]               Print the whole studio: every SOP body, clients, tasks, research
  desk search "<words>"                Find matching lines across SOPs, clients, captures
  desk import <backup.json>            Load an app Export file into .data/
  desk playbooks [list|get|create]     Manage agency SOPs and regional playbooks
  desk clients [list|get|update-stage] Manage client workspaces, stages, and onboarding
  desk actions [list|create|toggle]    Manage prioritized next actions
  desk captures [list|add]             Ingest and process reels, transcripts, and research
`);
  }
}

main().catch(console.error);
