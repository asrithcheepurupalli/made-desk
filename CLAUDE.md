# made. desk (Operating System for made. by ac)

`made. desk` is the internal operating system and living knowledge base for **made. by ac** (`desk.made-by-ac.com`). It manages client workspaces, onboarding pipelines, agency SOP playbooks, prioritized next actions, and incoming research/reel captures.

## Claude Code Integration & Direct Bridge

Before answering any questions regarding agency strategy, outreach messages, client proposals, onboarding checklists, or next actions for **made. by ac**, you MUST consult `made. desk` data.

### CLI Bridge Commands
You can run direct CLI commands from the project directory:

- **Get Full Studio Context** (full text of every SOP, client, task, capture; line 2 states when data last synced):
  `npx tsx scripts/desk.ts context`
  `npx tsx scripts/desk.ts search "<words>"`

Data lives in the user's browser (IndexedDB). `.data/` is a mirror written by the app's "Link Claude" button (sidebar) or loaded with `npx tsx scripts/desk.ts import <backup.json>`. It is read-only in practice: CLI writes are overwritten on the next sync. `.data/` is gitignored, never commit it.
- **Playbooks & SOPs**:
  `npx tsx scripts/desk.ts playbooks list`
  `npx tsx scripts/desk.ts playbooks get <slug>`
  `npx tsx scripts/desk.ts playbooks create "<title>" [category] [region]`
- **Client Pipeline & Workspaces**:
  `npx tsx scripts/desk.ts clients list`
  `npx tsx scripts/desk.ts clients get <slug>`
  `npx tsx scripts/desk.ts clients update-stage <slug> <lead|proposal|onboarding|active|retained|archived>`
- **Next Actions Priority Queue**:
  `npx tsx scripts/desk.ts actions list`
  `npx tsx scripts/desk.ts actions create "<title>" [priority] [description]`
  `npx tsx scripts/desk.ts actions toggle <id> <todo|in_progress|done|snoozed>`
- **Research & Reel Ingestion**:
  `npx tsx scripts/desk.ts captures list`
  `npx tsx scripts/desk.ts captures add "<transcript_or_text>" [source_url]`

### MCP Server
For Claude Desktop or Claude Code MCP configurations, the stdio MCP server is available at:
`npx tsx scripts/mcp-server.ts`

### Hard Agency Copy Rules
- Speak in studio voice: "we / our studio", never "I".
- No em dashes (—) or en dashes (–) anywhere. Use colons, periods, or standard commas.
- Aesthetic: Dense, high-contrast Sahaay + Prevayu brutalist styling (2px solid `#16130f` borders, `shadow-[3px_3px_0px_#16130f]`, `#f6f3ee` paper background, `#c8102e` red accent).

@AGENTS.md
