/* Shape of out/desk-outreach.json, written by the outreach sender (~/made-crew-outreach/src/send.mjs). */

export type OutreachStatus = "queued" | "active" | "done" | "replied" | "optout" | "bounced" | "held";

export interface OutreachMessage {
  step: number; // 1 = first email, 2 and 3 = follow-ups
  subject: string;
  text: string;
}

export interface OutreachContact {
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  industry: string;
  country: string;
  city: string;
  website: string;
  linkedin: string;
  variant: "A" | "B";
  status: OutreachStatus;
  hold: string | null;
  paused: boolean;
  sent: (OutreachMessage & { at: string })[];
  reply: { text: string; at: string } | null;
  next: (OutreachMessage & { dueOn: string | null }) | null;
  linkedinNote: string;
  linkedinSentAt: string | null;
  handledAt: string | null;
  siteObservation: string;
  screen: string;
}

export interface OutreachSnapshot {
  updatedAt: string;
  wave: string;
  pitch: string;
  from: string | null;
  listTotal: number;
  written: number;
  firstSendAt: string | null;
  caps: {
    newToday: number;
    sentFirstToday: number;
    sentToday: number;
    perRun: number;
    followUpAfter: number[];
    ramp: [number, number][];
    windows: Record<string, { tz: string; from: number; to: number }>;
    onParentDomain: boolean;
  };
  contacts: OutreachContact[];
  log: string[];
}

/** What the board writes back to out/desk-actions.json. The sender skips paused people. */
export type OutreachActions = Record<string, { paused?: boolean; linkedinSentAt?: string | null; handledAt?: string | null }>;
