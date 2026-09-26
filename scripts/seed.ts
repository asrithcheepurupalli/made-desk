import fs from "node:fs/promises";
import path from "node:path";
import { SEED_PLAYBOOKS, SEED_CLIENTS, SEED_ACTIONS } from "../src/lib/data/seeds";
import type { Capture } from "../src/lib/data/types";

const DATA_DIR = path.join(process.cwd(), ".data");

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // 1. Playbooks
  const playbooksPath = path.join(DATA_DIR, "playbooks.json");
  try {
    await fs.access(playbooksPath);
    console.log("playbooks.json already exists");
  } catch {
    await fs.writeFile(playbooksPath, JSON.stringify(SEED_PLAYBOOKS, null, 2), "utf-8");
    console.log("Created playbooks.json with seed data");
  }

  // 2. Clients
  const clientsPath = path.join(DATA_DIR, "clients.json");
  try {
    await fs.access(clientsPath);
    console.log("clients.json already exists");
  } catch {
    await fs.writeFile(clientsPath, JSON.stringify(SEED_CLIENTS, null, 2), "utf-8");
    console.log("Created clients.json with seed data");
  }

  // 3. Next Actions
  const actionsPath = path.join(DATA_DIR, "actions.json");
  try {
    await fs.access(actionsPath);
    console.log("actions.json already exists");
  } catch {
    await fs.writeFile(actionsPath, JSON.stringify(SEED_ACTIONS, null, 2), "utf-8");
    console.log("Created actions.json with seed data");
  }

  // 4. Captures (including the user's shared Instagram reel)
  const capturesPath = path.join(DATA_DIR, "captures.json");
  let captures: Capture[] = [];
  try {
    const raw = await fs.readFile(capturesPath, "utf-8");
    captures = JSON.parse(raw);
  } catch {}

  const reelUrl = "https://www.instagram.com/reel/DdtzGF_JMJF/?stkn=M2N0Y2xpc3J2MTk3";
  const existingReel = captures.find((c) => c.source_url === reelUrl);

  if (!existingReel) {
    const reelCapture: Capture = {
      id: "cap-reel-ddtzgf",
      raw_text: `Instagram Reel Strategy: The Pre-Onboarding Asset Kit & 48-Hour Momentum System.
Before onboarding any high-ticket agency client, send them a pre-configured 1-page asset request checklist:
1. Figma editor invite & design kit permissions.
2. Vector brand assets (.svg/.ai) and brand font licenses.
3. Domain DNS access or staging server keys.
4. Raw uncompressed photography & media library.
Pair this with an immediate WhatsApp voice greeting confirming timeline milestones within 2 hours of invoice clearance.`,
      source_url: reelUrl,
      source_type: "reel",
      status: "processed",
      summary: "High-ticket pre-onboarding asset kit and 48-hour client momentum workflow. Covers pre-flight asset collection and rapid communication channel setup.",
      extracted_insights: [
        {
          title: "Pre-Flight Asset Gathering Protocol",
          takeaway: "Collect vector logos, typography licenses, and Figma access before kick-off call to prevent delivery lag.",
          category: "onboarding",
        },
        {
          title: "2-Hour WhatsApp Welcome Rule",
          takeaway: "Send a 30s voice greeting and create the dedicated client group within 2 hours of payment confirmation.",
          category: "outreach",
        },
        {
          title: "Single Source of Truth Document",
          takeaway: "Maintain an interactive Notion-style workspace for each client to track open assets and stage deliverables.",
          category: "delivery",
        },
      ],
      suggested_category: "playbook",
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    captures.unshift(reelCapture);
    await fs.writeFile(capturesPath, JSON.stringify(captures, null, 2), "utf-8");
    console.log("Added Instagram reel capture to captures.json");
  }

  console.log("made. desk data seeding complete!");
}

main().catch(console.error);
