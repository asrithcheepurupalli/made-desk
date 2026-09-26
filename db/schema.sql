-- made. desk — Internal agency operating system & AI assistant
-- Supabase SQL schema. Run in the Supabase SQL editor.
-- Service role bypasses RLS; anon/public access gets nothing.

-- 1. Captures: raw incoming reels/transcripts/notes and AI classification
create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  source_url text,
  source_type text not null default 'reel', -- 'reel' | 'youtube' | 'web' | 'note' | 'whatsapp'
  status text not null default 'pending',   -- 'pending' | 'processed' | 'failed'
  summary text,
  extracted_insights jsonb not null default '[]'::jsonb,
  suggested_category text,                  -- 'playbook' | 'client' | 'action' | 'general'
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.captures enable row level security;
drop policy if exists "captures service role only" on public.captures;
create policy "captures service role only" on public.captures using (false) with check (false);

-- 2. Playbooks: organized editable SOPs and knowledge guides
create table if not exists public.playbooks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,                   -- 'acquisition' | 'onboarding' | 'outreach' | 'delivery' | 'pricing'
  region text default 'global',             -- 'uae' | 'india' | 'us' | 'global'
  tags text[] default array[]::text[],
  content jsonb not null default '[]'::jsonb,
  summary text,
  source_capture_ids uuid[] default array[]::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.playbooks enable row level security;
drop policy if exists "playbooks service role only" on public.playbooks;
create policy "playbooks service role only" on public.playbooks using (false) with check (false);

-- 3. Clients: workspace for active & prospective clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  company text,
  stage text not null default 'lead',      -- 'lead' | 'proposal' | 'onboarding' | 'active' | 'retained' | 'archived'
  region text default 'global',
  contact_info jsonb not null default '{}'::jsonb, -- { email, phone, whatsapp, role, website }
  onboarding_checklist jsonb not null default '[]'::jsonb, -- [{ id, task, completed, sent_at, notes }]
  content jsonb not null default '[]'::jsonb, -- document content
  tags text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clients enable row level security;
drop policy if exists "clients service role only" on public.clients;
create policy "clients service role only" on public.clients using (false) with check (false);

-- 4. Next Actions: auto-derived tasks & manual to-dos
create table if not exists public.next_actions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',     -- 'todo' | 'in_progress' | 'done' | 'snoozed'
  priority text not null default 'medium',  -- 'urgent' | 'high' | 'medium' | 'low'
  source_capture_id uuid references public.captures(id) on delete set null,
  linked_playbook_id uuid references public.playbooks(id) on delete set null,
  linked_client_id uuid references public.clients(id) on delete set null,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.next_actions enable row level security;
drop policy if exists "next_actions service role only" on public.next_actions;
create policy "next_actions service role only" on public.next_actions using (false) with check (false);

-- 5. Assistant Messages: conversation history
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null default 'default',
  role text not null,                      -- 'user' | 'assistant'
  content text not null,
  cited_sources jsonb not null default '[]'::jsonb, -- [{ type, id, title, slug }]
  created_at timestamptz not null default now()
);
alter table public.assistant_messages enable row level security;
drop policy if exists "assistant_messages service role only" on public.assistant_messages;
create policy "assistant_messages service role only" on public.assistant_messages using (false) with check (false);
