import { listPlaybooks } from "./playbooks";
import { listClients } from "./clients";
import { listNextActions } from "./actions";
import { listCaptures } from "./captures";
import { playbookToMarkdown, clientToMarkdown, captureToMarkdown } from "./text";

/**
 * The whole studio as one readable document: every SOP body, every client workspace,
 * open tasks, and recent research. `full: false` gives an index only.
 */
export async function buildStudioContext(opts: { full?: boolean; header?: string } = {}): Promise<string> {
  const full = opts.full !== false;
  const [playbooks, clients, actions, captures] = await Promise.all([
    listPlaybooks(),
    listClients(),
    listNextActions(),
    listCaptures(),
  ]);
  const open = actions.filter((a) => a.status !== "done");
  const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  open.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9));

  const out: string[] = ["# made. desk: studio knowledge base"];
  if (opts.header) out.push(opts.header);
  out.push(`${playbooks.length} playbooks/SOPs, ${clients.length} clients, ${open.length} open tasks, ${captures.length} captures.`);

  out.push("", "# PLAYBOOKS & SOPs");
  out.push(playbooks.length ? playbooks.map((p) => playbookToMarkdown(p, { body: full })).join("\n\n---\n\n") : "(none)");

  out.push("", "# CLIENTS");
  out.push(clients.length ? clients.map((c) => clientToMarkdown(c, { body: full })).join("\n\n") : "(none)");

  out.push("", "# OPEN NEXT ACTIONS");
  out.push(open.length ? open.map((a) => `- [${a.priority}/${a.status}] ${a.title}${a.description ? `: ${a.description}` : ""}`).join("\n") : "(none)");

  out.push("", "# RECENT RESEARCH CAPTURES");
  out.push(captures.length ? captures.slice(0, full ? 15 : 5).map((c) => captureToMarkdown(c)).join("\n\n") : "(none)");

  return out.join("\n");
}
