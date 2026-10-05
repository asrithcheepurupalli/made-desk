import type { Playbook, Client, NextAction } from "./types";

export const SEED_PLAYBOOKS: Playbook[] = [
  {
    id: "pb-uae-acquisition",
    slug: "uae-client-acquisition",
    title: "UAE & Gulf Client Acquisition Playbook",
    category: "acquisition",
    region: "uae",
    tags: ["outreach", "uae", "whatsapp", "high-ticket"],
    summary: "Outreach, greeting, and relationship-building standards for Dubai & Abu Dhabi founders and marketing directors.",
    content: [
      {
        id: "b1",
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: "UAE & Gulf Client Acquisition Playbook", styles: { bold: true } }],
      },
      {
        id: "b2",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Business in the GCC region is personal, relationship-driven, and happens predominantly on WhatsApp. Cold email works only when paired with immediate multi-channel presence.",
          },
        ],
      },
      {
        id: "b3",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "1. The WhatsApp Voice Note Rule", styles: { bold: true } }],
      },
      {
        id: "b4",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Never send long blocks of text on WhatsApp. Keep the opening text message to under 3 sentences, followed by a crisp 30-45 second voice note introducing yourself, stating exactly what visual or UX bottleneck you noticed on their site, and offering one free fix.",
          },
        ],
      },
      {
        id: "b5",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "2. Cultural & Pricing Nuances", styles: { bold: true } }],
      },
      {
        id: "b6",
        type: "bulletListItem",
        content: [{ type: "text", text: "Quote in AED or USD. Avoid vague hourly rates; always present fixed deliverables or monthly retainer tiers." }],
      },
      {
        id: "b7",
        type: "bulletListItem",
        content: [{ type: "text", text: "Timing: Sunday to Thursday are prime working days. Friday mornings are strictly off; reach out Friday late afternoon or Sunday morning." }],
      },
      {
        id: "b8",
        type: "bulletListItem",
        content: [{ type: "text", text: "Trust Markers: Reference past work with VANE or restaurant QR platforms to demonstrate tactile luxury craft." }],
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "pb-onboarding-sop",
    slug: "client-onboarding-protocol",
    title: "made. 48-Hour Client Onboarding Protocol",
    category: "onboarding",
    region: "global",
    tags: ["sop", "onboarding", "delivery", "client-delight"],
    summary: "Standard operating procedure to delight a new client within the first 48 hours of invoice clearance.",
    content: [
      {
        id: "b1",
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: "made. 48-Hour Client Onboarding Protocol", styles: { bold: true } }],
      },
      {
        id: "b2",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The first 48 hours after payment establish the trust ceiling for the entire engagement. Momentum must be instantaneous.",
          },
        ],
      },
      {
        id: "b3",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Step 1: Immediate WhatsApp / Slack Channel", styles: { bold: true } }],
      },
      {
        id: "b4",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Within 2 hours of payment confirmation, create the dedicated WhatsApp group or shared Slack channel. Send the welcome message introducing the studio and confirming our milestone schedule.",
          },
        ],
      },
      {
        id: "b5",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Step 2: Brand Asset & Access Request", styles: { bold: true } }],
      },
      {
        id: "b6",
        type: "bulletListItem",
        content: [{ type: "text", text: "Figma team invite or design asset folder." }],
      },
      {
        id: "b7",
        type: "bulletListItem",
        content: [{ type: "text", text: "DNS / Hosting / Domain credentials or invite link." }],
      },
      {
        id: "b8",
        type: "bulletListItem",
        content: [{ type: "text", text: "Vector logo files (.svg / .ai), brand typography licenses, and raw photography." }],
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "pb-cold-followup",
    slug: "high-ticket-followup-cadence",
    title: "High-Ticket Follow-Up Cadence (The 3-Touch System)",
    category: "outreach",
    region: "global",
    tags: ["followup", "sales", "cadence"],
    summary: "How to follow up with busy enterprise and luxury founders without sounding desperate.",
    content: [
      {
        id: "b1",
        type: "heading",
        props: { level: 1 },
        content: [{ type: "text", text: "The 3-Touch High-Ticket Follow-Up System", styles: { bold: true } }],
      },
      {
        id: "b2",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "80% of agency contracts are closed between touchpoints 2 and 4. Never send 'just checking in'. Every touch must deliver net-new value.",
          },
        ],
      },
      {
        id: "b3",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Touch 1 (Day +3): The Loom / Micro-Teaser", styles: { bold: true } }],
      },
      {
        id: "b4",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Share a 45-second screen recording showing an interactive prototype or a 1-page design mockup tailored to their brand.",
          },
        ],
      },
      {
        id: "b5",
        type: "heading",
        props: { level: 2 },
        content: [{ type: "text", text: "Touch 2 (Day +7): The Case Study Proof", styles: { bold: true } }],
      },
      {
        id: "b6",
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Highlight a similar problem we solved for a recent client with concrete before-and-after visual outcomes.",
          },
        ],
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const SEED_CLIENTS: Client[] = [
  {
    id: "client-al-reem",
    slug: "al-reem-hospitality",
    name: "Al Reem Hospitality",
    company: "Al Reem Group LLC",
    stage: "onboarding",
    region: "uae",
    contact_info: {
      email: "tariq@alreemgroup.ae",
      phone: "+971 50 123 4567",
      whatsapp: "+971 50 123 4567",
      role: "Managing Director",
      website: "alreemgroup.ae",
    },
    onboarding_checklist: [
      { id: "c1", task: "Send signed agreement & receipt of deposit", completed: true, sent_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: "c2", task: "Create dedicated WhatsApp group with Tariq & brand team", completed: true, sent_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: "c3", task: "Collect vector brand assets and menu photography", completed: false, notes: "Awaiting their Dropbox link" },
      { id: "c4", task: "Deliver interactive prototype staging link", completed: false },
      { id: "c5", task: "Sign-off on live QR table ordering launch date", completed: false },
    ],
    content: [
      {
        id: "b1",
        type: "paragraph",
        content: [{ type: "text", text: "High-end dining collective launching in Downtown Dubai and DIFC. Wants bespoke digital menus with dark/light dynamic theme matching their interior lighting." }],
      },
    ],
    tags: ["dubai", "hospitality", "qr-platform", "active-onboarding"],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "client-novus-health",
    slug: "novus-health-tech",
    name: "Novus Preventive Health",
    company: "Novus Bio Inc.",
    stage: "proposal",
    region: "us",
    contact_info: {
      email: "sarah@novushealth.io",
      role: "Head of Product",
      website: "novushealth.io",
    },
    onboarding_checklist: [
      { id: "n1", task: "Deliver scoped design sprint proposal", completed: true, sent_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: "n2", task: "Technical architecture alignment call", completed: false },
      { id: "n3", task: "Receive signed master services agreement", completed: false },
    ],
    content: [
      {
        id: "b1",
        type: "paragraph",
        content: [{ type: "text", text: "Health-tech brand needing Prevayu-style clean B/W clinical typography with high-trust micro-interactions." }],
      },
    ],
    tags: ["healthtech", "us", "web-app"],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const SEED_ACTIONS: NextAction[] = [
  {
    id: "act-1",
    title: "Collect vector brand assets & menu photography from Al Reem",
    description: "Ping Tariq on WhatsApp with the direct asset upload link.",
    status: "todo",
    priority: "urgent",
    linked_client_id: "client-al-reem",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "act-2",
    title: "Draft 30s voice-note script for Dubai hospitality prospects",
    description: "Follow the UAE Acquisition Playbook format (3 sentences + 1 direct UX insight).",
    status: "todo",
    priority: "high",
    linked_playbook_id: "pb-uae-acquisition",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "act-3",
    title: "Send follow-up Loom breakdown to Novus Health Tech",
    description: "Touchpoint #2 from the 3-Touch System: demonstrate clinical typography contrast.",
    status: "in_progress",
    priority: "high",
    linked_client_id: "client-novus-health",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
];
