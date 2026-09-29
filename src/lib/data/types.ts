export type SourceType = "reel" | "youtube" | "web" | "note" | "whatsapp";
export type CaptureStatus = "pending" | "processed" | "failed";
export type SourceQuality = "full" | "caption_only" | "manual";
export type SuggestedCategory = "playbook" | "client" | "action" | "general";

export interface ExtractedInsight {
  title: string;
  takeaway: string;
  category: string;
}

export interface Capture {
  id: string;
  raw_text: string;
  source_url?: string;
  source_type: SourceType;
  status: CaptureStatus;
  summary?: string;
  extracted_insights: ExtractedInsight[];
  suggested_category?: SuggestedCategory;
  screenshots?: string[];
  duration_seconds?: number;
  /** How much real content we got: full = video transcribed, caption_only = only the post caption, manual = pasted by us */
  source_quality?: SourceQuality;
  quality_note?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export type PlaybookCategory = "acquisition" | "onboarding" | "outreach" | "delivery" | "pricing" | "operations";
export type Region = "uae" | "india" | "us" | "global";

export interface Playbook {
  id: string;
  slug: string;
  title: string;
  category: PlaybookCategory;
  region: Region;
  tags: string[];
  content: any[]; // JSON array representing blocks or document structure
  summary?: string;
  source_capture_ids?: string[];
  created_at: string;
  updated_at: string;
}

export type ClientStage = "lead" | "proposal" | "onboarding" | "active" | "retained" | "archived";

export interface ClientContactInfo {
  email?: string;
  phone?: string;
  whatsapp?: string;
  role?: string;
  website?: string;
}

export type ContactInfo = ClientContactInfo;

export interface OnboardingChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  sent_at?: string;
  notes?: string;
}

export interface Client {
  id: string;
  slug: string;
  name: string;
  company?: string;
  stage: ClientStage;
  region: Region;
  contact_info: ClientContactInfo;
  onboarding_checklist: OnboardingChecklistItem[];
  content: any[]; // document blocks or freeform notes
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ActionPriority = "urgent" | "high" | "medium" | "low";
export type ActionStatus = "todo" | "in_progress" | "done" | "snoozed";

export interface NextAction {
  id: string;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: ActionPriority;
  source_capture_id?: string;
  linked_playbook_id?: string;
  linked_client_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CitedSource {
  type: "playbook" | "client" | "action" | "capture";
  id: string;
  title: string;
  slug?: string;
}

export interface AssistantMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  cited_sources: CitedSource[];
  created_at: string;
}

export interface MasterChange {
  at: string;
  summary: string;
}

/** One canonical SOP built by merging several overlapping playbooks. Auto-maintained. */
export interface MasterSop {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: PlaybookCategory;
  region: Region;
  tags: string[];
  content: any[];
  source_playbook_ids: string[];
  /** Fingerprint of the member SOPs (ids + last edit) this version was built from */
  source_stamp: string;
  version: number;
  changelog: MasterChange[];
  merged_at: string;
  created_at: string;
  updated_at: string;
}
