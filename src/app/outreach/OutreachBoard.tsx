"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FolderOpen,
  Mail,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Reply,
  Search,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { linkFolder, readFolder, reconnectFolder, saveAction, unlinkFolder, type FolderState } from "@/lib/outreach/link";
import { sampleSnapshot } from "@/lib/outreach/sample";
import type { OutreachActions, OutreachContact, OutreachSnapshot } from "@/lib/outreach/types";

const REFRESH_MS = 30_000;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ago(iso?: string | null) {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
const dayLabel = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const stamp = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
function dueWords(dueOn: string | null) {
  if (!dueOn) return "in the queue";
  const days = Math.round((new Date(`${dueOn}T12:00:00`).getTime() - new Date(`${todayIso()}T12:00:00`).getTime()) / 86_400_000);
  if (days < 0) return `overdue by ${-days}d`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due ${dayLabel(dueOn)}`;
}
const STEP_NAME = ["", "First email", "Follow-up 1", "Closing note"];

/** The one state a person is in, as the board shows it. */
type View = "reply" | "due" | "waiting" | "queued" | "held" | "closed" | "optout" | "bounced" | "paused";
function viewOf(c: OutreachContact): View {
  if (c.status === "replied") return "reply";
  if (c.status === "held") return "held";
  if (c.status === "optout") return "optout";
  if (c.status === "bounced") return "bounced";
  if (c.status === "done") return "closed";
  if (c.paused) return "paused";
  if (c.status === "active") return c.next?.dueOn && c.next.dueOn <= todayIso() ? "due" : "waiting";
  return "queued";
}
const VIEW: Record<View, { label: string; cls: string }> = {
  reply: { label: "Replied", cls: "bg-[#c8102e] text-white border-[#16130f]" },
  due: { label: "Follow-up due", cls: "bg-[#bd9b4e] text-white border-[#16130f]" },
  waiting: { label: "Waiting", cls: "bg-white text-[#16130f] border-[#16130f]" },
  queued: { label: "In queue", cls: "bg-[#ede8df] text-[#16130f] border-[#16130f]" },
  held: { label: "Held", cls: "bg-[#fbe8eb] text-[#c8102e] border-[#c8102e]" },
  closed: { label: "Closed, no reply", cls: "bg-[#16130f] text-[#f6f3ee] border-[#16130f]" },
  optout: { label: "Opted out", cls: "bg-[#ede8df] text-[#7c7770] border-[#7c7770]" },
  bounced: { label: "Bounced", cls: "bg-[#ede8df] text-[#7c7770] border-[#7c7770]" },
  paused: { label: "Paused", cls: "bg-white text-[#7c7770] border-[#7c7770]" },
};
/** What our own playbooks say to do in each state (from the Master SOPs on this desk). */
const NEXT_MOVE: Record<View, string> = {
  reply: "Answer today. Make the screen and send the link within 48 hours. Keep it short and end on the work, not on a question.",
  due: "The sender will send this on its next run inside their office hours. It adds a new idea and never repeats the first email.",
  waiting: "Nothing to do. The next note goes out by itself on the due date unless they answer first.",
  queued: "Waiting for a slot. New first emails are capped each day to protect the domain.",
  held: "The pre-send check stopped this one. Rewrite it from their current site, then it rejoins the queue.",
  closed: "File closed. All three notes went out. Our playbook says stop here and spend the time on people who are ready.",
  optout: "They asked us to stop. They are on the do-not-contact list for every wave.",
  bounced: "The address no longer works. It is on the do-not-contact list.",
  paused: "You paused this person. Nothing is sent until you resume.",
};

function Badge({ view }: { view: View }) {
  return <span className={`label inline-flex items-center px-2 py-0.5 border whitespace-nowrap ${VIEW[view].cls}`}>{VIEW[view].label}</span>;
}

function Steps({ c }: { c: OutreachContact }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${c.sent.length} of 3 sent`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`w-2.5 h-2.5 border border-[#16130f] ${c.sent.some((s) => s.step === n) ? "bg-[#16130f]" : "bg-white"}`} />
      ))}
    </span>
  );
}

/** A send window ("noon to 4:30pm Eastern") in the viewer's own clock. */
function windowLocal(w: { tz: string; from: number; to: number }) {
  const now = new Date();
  const there = new Date(now.toLocaleString("en-US", { timeZone: w.tz }));
  const shift = (now.getTime() - there.getTime()) / 3_600_000;
  const fmt = (h: number) => {
    const t = (((h + shift) % 24) + 24) % 24;
    const d = new Date();
    d.setHours(Math.floor(t), Math.round((t % 1) * 60), 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };
  return `${fmt(w.from)} to ${fmt(w.to)}`;
}

export function OutreachBoard({ initialSample = false }: { initialSample?: boolean }) {
  const { showToast } = useToast();
  const [folder, setFolder] = useState<FolderState | null>(null);
  const [sample, setSample] = useState(initialSample);
  const [now, setNow] = useState(() => Date.now()); // one clock for the whole board, moved by the timer below
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "needs" | View>("all");
  const [query, setQuery] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const [localActions, setLocalActions] = useState<OutreachActions>({});

  const refresh = useCallback(async () => {
    try {
      setFolder(await readFolder());
    } catch {
      setFolder({ kind: "unlinked" });
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 15_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      clearInterval(clock);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const run = async (fn: () => Promise<FolderState>) => {
    setBusy(true);
    try {
      setFolder(await fn());
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) showToast(err instanceof Error ? err.message : "Could not open that folder.", "error");
    } finally {
      setBusy(false);
    }
  };

  const sampleData = useMemo(() => (sample ? sampleSnapshot() : null), [sample]);
  const snap: OutreachSnapshot | null = sampleData ?? (folder?.kind === "ready" ? folder.snapshot : null);

  // marks made on this board show at once; the file on disk catches up on the next read
  const contacts = useMemo(() => {
    if (!snap) return [];
    const disk = folder?.kind === "ready" && !sample ? folder.actions : {};
    return snap.contacts.map((c) => {
      const a = { ...disk[c.email], ...localActions[c.email] };
      return { ...c, paused: a.paused ?? c.paused, linkedinSentAt: a.linkedinSentAt !== undefined ? a.linkedinSentAt : c.linkedinSentAt, handledAt: a.handledAt !== undefined ? a.handledAt : c.handledAt };
    });
  }, [snap, folder, sample, localActions]);

  const mark = async (email: string, patch: OutreachActions[string], done: string) => {
    setLocalActions((prev) => ({ ...prev, [email]: { ...prev[email], ...patch } }));
    if (sample) return showToast(`${done} (sample data, nothing saved)`, "info");
    try {
      await saveAction(email, patch);
      showToast(done);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save that.", "error");
    }
  };
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${what} copied`);
    } catch {
      showToast("Could not copy. Select the text and copy it by hand.", "error");
    }
  };

  const stats = useMemo(() => {
    const by = (v: View) => contacts.filter((c) => viewOf(c) === v);
    const emailed = contacts.filter((c) => c.sent.length > 0);
    const replied = by("reply");
    const version = (v: "A" | "B") => {
      const sent = emailed.filter((c) => c.variant === v).length;
      const rep = replied.filter((c) => c.variant === v).length;
      return { sent, rep, rate: sent ? (100 * rep) / sent : 0 };
    };
    return {
      emailed: emailed.length,
      emails: contacts.reduce((n, c) => n + c.sent.length, 0),
      replied: replied.length,
      rate: emailed.length ? (100 * replied.length) / emailed.length : 0,
      toHandle: replied.filter((c) => !c.handledAt),
      due: by("due"),
      waiting: by("waiting").length,
      queued: by("queued").length,
      held: by("held"),
      closed: by("closed").length,
      lost: by("optout").length + by("bounced").length,
      linkedinOpen: emailed.filter((c) => !c.linkedinSentAt && ["due", "waiting"].includes(viewOf(c))).length,
      A: version("A"),
      B: version("B"),
    };
  }, [contacts]);

  // the next working days: follow-ups already owed, plus how many new first emails the cap allows
  const schedule = useMemo(() => {
    if (!snap) return [];
    const days: { iso: string; followUps: OutreachContact[]; fresh: number }[] = [];
    let queued = stats.queued;
    const first = snap.firstSendAt ? new Date(snap.firstSendAt).getTime() : now;
    for (let i = 0; days.length < 6 && i < 12; i++) {
      const d = new Date(now + i * 86_400_000);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const age = Math.floor((d.getTime() - first) / 86_400_000);
      let cap = snap.caps.ramp.filter(([from]) => age >= from).pop()?.[1] ?? snap.caps.ramp[0][1];
      if (snap.caps.onParentDomain) cap = Math.min(cap, 10);
      if (i === 0) cap = Math.max(0, cap - snap.caps.sentFirstToday);
      const fresh = Math.min(queued, cap);
      queued -= fresh;
      const followUps = contacts.filter((c) => c.status === "active" && !c.paused && c.next?.dueOn && (i === 0 ? c.next.dueOn <= iso : c.next.dueOn === iso));
      days.push({ iso, followUps, fresh });
    }
    return days;
  }, [snap, contacts, stats.queued, now]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order: View[] = ["reply", "due", "held", "waiting", "queued", "paused", "closed", "optout", "bounced"];
    return contacts
      .filter((c) => {
        const v = viewOf(c);
        if (filter === "needs") return (v === "reply" && !c.handledAt) || v === "held";
        return filter === "all" || v === filter;
      })
      .filter((c) => !q || `${c.firstName} ${c.lastName} ${c.company} ${c.email} ${c.title}`.toLowerCase().includes(q))
      .sort((a, b) => order.indexOf(viewOf(a)) - order.indexOf(viewOf(b)) || (a.next?.dueOn || "9").localeCompare(b.next?.dueOn || "9"));
  }, [contacts, filter, query]);

  const open = contacts.find((c) => c.email === openEmail) || null;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenEmail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stale = snap && !sample && now - new Date(snap.updatedAt).getTime() > 3 * 3_600_000;
  const counts: Record<string, number> = { all: contacts.length, needs: stats.toHandle.length + stats.held.length };
  for (const c of contacts) counts[viewOf(c)] = (counts[viewOf(c)] || 0) + 1;
  const chips: ["all" | "needs" | View, string][] = [["all", "Everyone"], ["needs", "Needs you"], ["reply", "Replied"], ["due", "Due"], ["waiting", "Waiting"], ["queued", "In queue"], ["held", "Held"], ["closed", "Closed"]];

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#16130f]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-[#16130f] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="border-2 border-[#16130f] p-1.5 hover:bg-[#ede8df]" aria-label="Back to desk">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full border border-[#16130f] ${snap && !stale ? "bg-[#c8102e] animate-pulse" : "bg-[#ede8df]"}`} />
                <span className="label text-[#c8102e]">Outreach live board</span>
                {sample && <span className="label bg-[#bd9b4e] text-white border border-[#16130f] px-1.5 py-0.5">Sample data</span>}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display italic font-semibold text-2xl leading-none">
                  made<span className="not-italic text-[#c8102e]">.</span>
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest border border-[#16130f] px-1.5 bg-[#f6f3ee]">outreach</span>
                {snap && <span className="font-mono text-[11px] text-[#7c7770] truncate hidden sm:inline">{snap.wave}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {snap && (
              <span className="font-mono text-[11px] text-[#7c7770]">
                Sender last ran {ago(snap.updatedAt)}
                {!sample && " · board refreshes every 30s"}
              </span>
            )}
            {!sample && folder?.kind === "ready" && (
              <button type="button" onClick={refresh} className="border-2 border-[#16130f] bg-white p-1.5 hover:bg-[#ede8df]" aria-label="Refresh now">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {sample && (
              <button type="button" onClick={() => { setSample(false); setLocalActions({}); }} className="brutal-btn-outline !py-1.5 !px-3">
                Leave sample
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Not connected yet */}
        {!snap && (
          <section className="brutal-card-flat shadow-[3px_3px_0px_#16130f] p-6 md:p-10 max-w-2xl">
            <FolderOpen className="w-8 h-8 text-[#c8102e]" />
            <h1 className="font-display italic font-semibold text-3xl mt-3">Connect the outreach folder</h1>
            {folder === null && <p className="font-mono text-xs text-[#7c7770] mt-3">Checking the link…</p>}
            {folder?.kind === "unsupported" && (
              <p className="text-sm mt-3 leading-relaxed">This board reads the sender&apos;s files straight from the studio Mac, which needs Chrome, Edge, Arc or Brave on that Mac. It cannot work on a phone or in Safari.</p>
            )}
            {folder?.kind === "unlinked" && (
              <>
                <p className="text-sm mt-3 leading-relaxed">
                  The sender keeps everything in one folder on the studio Mac. Pick it once and this board reads it live. Nothing is uploaded, so contact details stay on the machine.
                </p>
                <p className="font-mono text-xs bg-[#ede8df] border border-[#16130f] px-2 py-1.5 mt-3 break-all">~/made-crew-outreach/out</p>
                <button type="button" disabled={busy} onClick={() => run(linkFolder)} className="brutal-btn-red mt-4">
                  <FolderOpen className="w-4 h-4" /> Pick the folder
                </button>
              </>
            )}
            {folder?.kind === "locked" && (
              <>
                <p className="text-sm mt-3 leading-relaxed">The browser needs one click to read /{folder.folder} again after a restart.</p>
                <button type="button" disabled={busy} onClick={() => run(reconnectFolder)} className="brutal-btn-red mt-4">
                  Reconnect
                </button>
              </>
            )}
            {folder?.kind === "empty" && (
              <>
                <p className="text-sm mt-3 leading-relaxed">/{folder.folder} is linked, but the sender has not written its board file there yet. Run this once in the outreach project, or check that the right folder is linked.</p>
                <p className="font-mono text-xs bg-[#ede8df] border border-[#16130f] px-2 py-1.5 mt-3">node src/send.mjs --snapshot</p>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={refresh} className="brutal-btn">Check again</button>
                  <button type="button" onClick={() => run(unlinkFolder)} className="brutal-btn-outline">Pick another folder</button>
                </div>
              </>
            )}
            <button type="button" onClick={() => setSample(true)} className="block font-mono text-xs underline text-[#7c7770] mt-5">
              Preview the board with sample data
            </button>
          </section>
        )}

        {snap && (
          <>
            {stale && (
              <div className="border-2 border-[#c8102e] bg-[#fbe8eb] px-4 py-3 flex items-start gap-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-[#c8102e] mt-0.5 shrink-0" />
                <span>The sender has not run since {stamp(snap.updatedAt)}. If the schedule is on, check that the Mac is awake. What you see below is from that run.</span>
              </div>
            )}

            {/* Numbers */}
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { k: "People emailed", v: stats.emailed, sub: `${stats.emails} emails · ${snap.written} of ${snap.listTotal} written` },
                { k: "Replies", v: stats.replied, sub: stats.emailed ? `${stats.rate.toFixed(1)}% of people emailed` : "no sends yet", hot: stats.replied > 0 },
                { k: "Follow-ups due", v: stats.due.length, sub: `${stats.waiting} more waiting on a date` },
                { k: "In queue", v: stats.queued, sub: `${Math.max(0, snap.caps.newToday - snap.caps.sentFirstToday)} new allowed today (${snap.caps.sentFirstToday} of ${snap.caps.newToday} used)` },
                { k: "Held by checks", v: stats.held.length, sub: "stopped before sending", hot: stats.held.length > 0 },
                { k: "Closed or lost", v: stats.closed + stats.lost, sub: `${stats.closed} no reply · ${stats.lost} opted out or bounced` },
              ].map((s) => (
                <div key={s.k} className="brutal-card-flat shadow-[3px_3px_0px_#16130f] p-4">
                  <p className="label text-[#7c7770]">{s.k}</p>
                  <p className={`font-display font-semibold text-4xl mt-1 leading-none ${s.hot ? "text-[#c8102e]" : ""}`}>{s.v}</p>
                  <p className="font-mono text-[10px] text-[#7c7770] mt-2 leading-snug">{s.sub}</p>
                </div>
              ))}
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
              {/* Needs you */}
              <div className="lg:col-span-2 brutal-card-flat shadow-[3px_3px_0px_#16130f]">
                <div className="px-4 py-3 border-b-2 border-[#16130f] flex items-center justify-between bg-[#16130f] text-[#f6f3ee]">
                  <span className="label">Needs you now</span>
                  <span className="label text-[#bd9b4e]">{stats.toHandle.length + stats.held.length} open</span>
                </div>
                <div className="divide-y-2 divide-[#16130f]">
                  {stats.toHandle.length + stats.held.length === 0 && (
                    <p className="p-4 text-sm text-[#7c7770]">Nothing is waiting on you. Replies and held emails show up here the moment the sender sees them.</p>
                  )}
                  {stats.toHandle.map((c) => (
                    <div key={c.email} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                      <Reply className="w-4 h-4 text-[#c8102e] mt-1 shrink-0 hidden sm:block" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          {c.firstName} {c.lastName} <span className="font-normal text-[#7c7770]">· {c.company} · replied {ago(c.reply?.at)}</span>
                        </p>
                        <p className="text-sm mt-1 border-l-4 border-[#c8102e] pl-3 whitespace-pre-wrap break-words">{c.reply?.text}</p>
                        <p className="font-mono text-[11px] text-[#7c7770] mt-2">We offered to redesign: {c.screen}. {NEXT_MOVE.reply}</p>
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button type="button" onClick={() => setOpenEmail(c.email)} className="brutal-btn-outline !py-1.5 !px-3">Open</button>
                        <button type="button" onClick={() => mark(c.email, { handledAt: new Date().toISOString() }, "Marked as handled")} className="brutal-btn !py-1.5 !px-3">Handled</button>
                      </div>
                    </div>
                  ))}
                  {stats.held.map((c) => (
                    <div key={c.email} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-[#c8102e] mt-1 shrink-0 hidden sm:block" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          {c.firstName} {c.lastName} <span className="font-normal text-[#7c7770]">· {c.company} · held before sending</span>
                        </p>
                        <p className="text-sm mt-1 break-words">{c.hold}</p>
                        <p className="font-mono text-[11px] bg-[#ede8df] border border-[#16130f] px-2 py-1 mt-2 break-all">node src/wave.mjs --redo {c.email}</p>
                      </div>
                      <button type="button" onClick={() => copy(`node src/wave.mjs --redo ${c.email}`, "Rewrite command")} className="brutal-btn-outline !py-1.5 !px-3 shrink-0">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Which version wins */}
              <div className="brutal-card-flat shadow-[3px_3px_0px_#16130f] p-4">
                <p className="label text-[#7c7770]">Which first email works</p>
                {(["A", "B"] as const).map((v) => {
                  const s = stats[v];
                  const best = Math.max(stats.A.rate, stats.B.rate, 1);
                  return (
                    <div key={v} className="mt-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold">
                          Version {v} <span className="font-normal text-[#7c7770]">{v === "A" ? "full, with the VANE link" : "short, no links"}</span>
                        </span>
                        <span className="font-mono text-sm font-bold">{s.sent ? `${s.rate.toFixed(1)}%` : "n/a"}</span>
                      </div>
                      <div className="h-3 border-2 border-[#16130f] bg-white mt-1.5">
                        <div className="h-full bg-[#c8102e]" style={{ width: `${(100 * s.rate) / best}%` }} />
                      </div>
                      <p className="font-mono text-[10px] text-[#7c7770] mt-1">
                        {s.rep} replies from {s.sent} people
                      </p>
                    </div>
                  );
                })}
                <p className="font-mono text-[10px] text-[#7c7770] mt-4 leading-snug">With fewer than about 100 people per version the gap is a hint, not a result.</p>
                <div className="border-t-2 border-[#16130f] mt-4 pt-3">
                  <p className="label text-[#7c7770]">Sends go out, in your time</p>
                  {Object.entries(snap.caps.windows).map(([region, w]) => (
                    <p key={region} className="font-mono text-[11px] mt-1">
                      {region}: {windowLocal(w)}, weekdays
                    </p>
                  ))}
                  <p className="font-mono text-[10px] text-[#7c7770] mt-2 leading-snug">
                    {snap.caps.perRun} at most per run, from {snap.from || "the sending mailbox"}. The Mac has to be awake.
                  </p>
                </div>
              </div>
            </section>

            {/* The days ahead */}
            <section className="brutal-card-flat shadow-[3px_3px_0px_#16130f]">
              <div className="px-4 py-3 border-b-2 border-[#16130f] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c8102e]" />
                <span className="label">The next six working days</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x-0 md:divide-x-2 divide-[#16130f]">
                {schedule.map((d, i) => (
                  <div key={d.iso} className={`p-3 border-b-2 xl:border-b-0 border-[#16130f] ${i === 0 ? "bg-[#fff8e6]" : ""}`}>
                    <p className="label">{i === 0 ? "Today" : dayLabel(d.iso)}</p>
                    <p className="font-mono text-xs mt-2">
                      <span className="font-bold text-base">{d.followUps.length}</span> follow-ups
                    </p>
                    <p className="font-mono text-xs">
                      <span className="font-bold text-base">{d.fresh}</span> new first emails
                    </p>
                    <div className="mt-2 space-y-0.5">
                      {d.followUps.slice(0, 4).map((c) => (
                        <button key={c.email} type="button" onClick={() => setOpenEmail(c.email)} className="block w-full text-left font-mono text-[10px] text-[#7c7770] underline truncate">
                          {c.firstName} {c.lastName}, {STEP_NAME[c.next!.step].toLowerCase()}
                        </button>
                      ))}
                      {d.followUps.length > 4 && <p className="font-mono text-[10px] text-[#7c7770]">and {d.followUps.length - 4} more</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Everyone */}
            <section className="brutal-card-flat shadow-[3px_3px_0px_#16130f]">
              <div className="px-4 py-3 border-b-2 border-[#16130f] flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {chips.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`label px-2.5 py-1.5 border-2 border-[#16130f] ${filter === key ? "bg-[#16130f] text-[#f6f3ee]" : "bg-white hover:bg-[#ede8df]"}`}
                    >
                      {label} <span className={filter === key ? "text-[#bd9b4e]" : "text-[#7c7770]"}>{counts[key] || 0}</span>
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 border-2 border-[#16130f] bg-white px-2.5 py-1.5 lg:w-72">
                  <Search className="w-3.5 h-3.5 text-[#7c7770] shrink-0" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a person or company" className="w-full bg-transparent outline-none font-mono text-xs" />
                </label>
              </div>

              {shown.length === 0 && <p className="p-6 text-sm text-[#7c7770]">Nobody matches that.</p>}

              {/* Wide screens: a table */}
              {shown.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#16130f] bg-[#ede8df]">
                        {["Person", "Status", "Sent", "Last email", "What happens next", "LinkedIn"].map((h) => (
                          <th key={h} className="label px-4 py-2 text-[#7c7770] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((c) => {
                        const v = viewOf(c);
                        const last = c.sent[c.sent.length - 1];
                        return (
                          <tr key={c.email} onClick={() => setOpenEmail(c.email)} className="border-b border-[#e4ddd0] hover:bg-[#fff8e6] cursor-pointer align-top">
                            <td className="px-4 py-2.5 max-w-[280px]">
                              <p className="font-bold truncate">{c.firstName} {c.lastName}</p>
                              <p className="font-mono text-[11px] text-[#7c7770] truncate">{c.title}, {c.company}</p>
                            </td>
                            <td className="px-4 py-2.5"><Badge view={v} /></td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <Steps c={c} /> <span className="font-mono text-[10px] text-[#7c7770] ml-1">v{c.variant}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">{last ? `${STEP_NAME[last.step]}, ${ago(last.at)}` : "not yet"}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px] max-w-[320px]">
                              {v === "reply" ? (c.handledAt ? "Handled. Keep the thread going by hand." : "Answer them today.") : c.next && !c.paused ? `${STEP_NAME[c.next.step]}, ${dueWords(c.next.dueOn)}` : v === "held" ? <span className="text-[#c8102e]">{c.hold}</span> : "Nothing more will be sent."}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">{c.linkedinSentAt ? "sent" : c.sent.length ? "to send by hand" : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Phones: cards */}
              <div className="md:hidden divide-y-2 divide-[#16130f]">
                {shown.map((c) => {
                  const v = viewOf(c);
                  return (
                    <button key={c.email} type="button" onClick={() => setOpenEmail(c.email)} className="w-full text-left p-4 active:bg-[#fff8e6]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{c.firstName} {c.lastName}</p>
                          <p className="font-mono text-[11px] text-[#7c7770] truncate">{c.company}</p>
                        </div>
                        <Badge view={v} />
                      </div>
                      <div className="flex items-center justify-between mt-2 font-mono text-[11px] text-[#7c7770]">
                        <Steps c={c} />
                        <span>{c.next && !c.paused ? `${STEP_NAME[c.next.step]}, ${dueWords(c.next.dueOn)}` : c.reply ? `replied ${ago(c.reply.at)}` : ""}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
              {/* Sender log */}
              <div className="lg:col-span-2 brutal-card-flat shadow-[3px_3px_0px_#16130f]">
                <div className="px-4 py-3 border-b-2 border-[#16130f]"><span className="label">What the sender did</span></div>
                <div className="max-h-72 overflow-y-auto p-3 space-y-1">
                  {snap.log.length === 0 && <p className="text-sm text-[#7c7770] p-1">No runs logged yet.</p>}
                  {[...snap.log].reverse().map((line, i) => {
                    const [at, ...rest] = line.split("  ");
                    const text = rest.join("  ");
                    const hot = /REPLIED|bounced|PAUSED|not sent|failed/.test(text);
                    return (
                      <p key={i} className="font-mono text-[11px] leading-snug break-words">
                        <span className="text-[#7c7770]">{/^\d{4}-/.test(at) ? stamp(at) : at}</span> <span className={hot ? "text-[#c8102e] font-bold" : ""}>{text}</span>
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* The rules we follow */}
              <div className="brutal-card-flat shadow-[3px_3px_0px_#16130f] p-4">
                <p className="label text-[#7c7770]">How we keep in touch</p>
                <ol className="mt-3 space-y-2.5 text-sm leading-snug list-decimal pl-4">
                  <li>Day 0: the first email. We give before we ask, and the only ask is a one-word reply.</li>
                  <li>Three working days on: a follow-up with a new idea. We never repeat ourselves or say we are following up.</li>
                  <li>Five working days after that: an honest closing note with no pressure. Then the file is closed.</li>
                  <li>One LinkedIn note per person, sent by hand after the first email. {stats.linkedinOpen} still to send.</li>
                  <li>A reply stops everything automatic. We answer the same day and send the work within 48 hours.</li>
                </ol>
                <Link href="/masters" className="inline-flex items-center gap-1 font-mono text-[11px] underline mt-4">
                  From our Master SOPs <ExternalLink className="w-3 h-3" />
                </Link>
                {!sample && folder?.kind === "ready" && (
                  <p className="font-mono text-[10px] text-[#7c7770] mt-4 leading-snug">
                    Reading /{folder.folder} on this Mac.{" "}
                    <button type="button" onClick={() => run(unlinkFolder)} className="underline">Unlink</button>
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* One person, start to finish */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#16130f]/60" onClick={() => setOpenEmail(null)} />
          <aside className="relative w-full max-w-xl h-full bg-[#f6f3ee] border-l-2 border-[#16130f] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b-2 border-[#16130f] px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge view={viewOf(open)} />
                <h2 className="font-display italic font-semibold text-2xl mt-1.5 leading-tight">{open.firstName} {open.lastName}</h2>
                <p className="font-mono text-[11px] text-[#7c7770] break-words">{open.title}, {open.company} · {[open.city, open.country].filter(Boolean).join(", ")}</p>
                <p className="font-mono text-[11px] break-all">{open.email}</p>
              </div>
              <button type="button" onClick={() => setOpenEmail(null)} className="border-2 border-[#16130f] p-1.5 hover:bg-[#ede8df] shrink-0" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="border-2 border-[#16130f] bg-[#fff8e6] p-3">
                <p className="label text-[#7c7770]">Next move</p>
                <p className="text-sm mt-1 leading-snug">{NEXT_MOVE[viewOf(open)]}</p>
                {open.hold && <p className="text-sm mt-2 text-[#c8102e] break-words">{open.hold}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {open.website && (
                  <a href={open.website} target="_blank" rel="noreferrer" className="brutal-btn-outline !py-1.5 !px-3">
                    <ExternalLink className="w-3.5 h-3.5" /> Their site
                  </a>
                )}
                {["queued", "active"].includes(open.status) && (
                  <button type="button" onClick={() => mark(open.email, { paused: !open.paused }, open.paused ? "Resumed" : "Paused. The sender will skip them.")} className="brutal-btn-outline !py-1.5 !px-3">
                    {open.paused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />} {open.paused ? "Resume" : "Pause"}
                  </button>
                )}
                {open.reply && open.status === "replied" && (
                  <>
                    <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.sent[0]?.subject || ""}`)}`} className="brutal-btn-red !py-1.5 !px-3">
                      <Mail className="w-3.5 h-3.5" /> Write back
                    </a>
                    <button type="button" onClick={() => mark(open.email, { handledAt: open.handledAt ? null : new Date().toISOString() }, open.handledAt ? "Marked as open again" : "Marked as handled")} className="brutal-btn-outline !py-1.5 !px-3">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {open.handledAt ? "Handled" : "Mark handled"}
                    </button>
                  </>
                )}
              </div>

              <div>
                <p className="label text-[#7c7770]">What we noticed and offered</p>
                <p className="text-sm mt-1 break-words">{open.siteObservation || "Their site could not be read when this was written."}</p>
                <p className="text-sm mt-1">Screen we offered to redesign: <span className="font-bold">{open.screen}</span></p>
              </div>

              {/* Timeline */}
              <div>
                <p className="label text-[#7c7770]">The thread</p>
                <div className="mt-2 space-y-3">
                  {open.sent.length === 0 && <p className="text-sm text-[#7c7770]">Nothing has been sent to this person yet.</p>}
                  {open.sent.map((m) => (
                    <div key={m.step} className="border-2 border-[#16130f] bg-white">
                      <div className="px-3 py-2 border-b border-[#16130f] flex items-center justify-between gap-2 bg-[#ede8df]">
                        <span className="label">{STEP_NAME[m.step]}{m.step === 1 ? `, version ${open.variant}` : ""}</span>
                        <span className="font-mono text-[10px] text-[#7c7770]">sent {stamp(m.at)}</span>
                      </div>
                      <p className="px-3 pt-2 text-sm font-bold break-words">{m.subject}</p>
                      <p className="px-3 pb-3 pt-1 text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                  {open.reply && (
                    <div className="border-2 border-[#c8102e] bg-white ml-4">
                      <div className="px-3 py-2 border-b border-[#c8102e] flex items-center justify-between gap-2 bg-[#fbe8eb]">
                        <span className="label text-[#c8102e]">{open.status === "optout" ? "They opted out" : "Their reply"}</span>
                        <span className="font-mono text-[10px] text-[#7c7770]">{stamp(open.reply.at)}</span>
                      </div>
                      <p className="p-3 text-sm whitespace-pre-wrap break-words leading-relaxed">{open.reply.text}</p>
                    </div>
                  )}
                  {open.next && (
                    <div className="border-2 border-dashed border-[#16130f] bg-[#f6f3ee]">
                      <div className="px-3 py-2 border-b border-dashed border-[#16130f] flex items-center justify-between gap-2">
                        <span className="label">Up next: {STEP_NAME[open.next.step]}</span>
                        <span className="font-mono text-[10px] font-bold">{open.paused ? "paused" : dueWords(open.next.dueOn)}</span>
                      </div>
                      <p className="px-3 pt-2 text-sm font-bold break-words">{open.next.subject}</p>
                      <p className="px-3 pb-3 pt-1 text-sm whitespace-pre-wrap break-words leading-relaxed text-[#4a453f]">{open.next.text}</p>
                      <p className="px-3 pb-3 font-mono text-[10px] text-[#7c7770]">It is checked against their live site again right before it goes.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LinkedIn, by hand */}
              <div className="border-2 border-[#16130f] bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="label text-[#7c7770]">LinkedIn note, sent by hand</p>
                  {open.linkedinSentAt && <span className="label text-[#16130f]">sent {ago(open.linkedinSentAt)}</span>}
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap break-words leading-relaxed">{open.linkedinNote}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" onClick={() => copy(open.linkedinNote, "Note")} className="brutal-btn-outline !py-1.5 !px-3">
                    <Copy className="w-3.5 h-3.5" /> Copy note
                  </button>
                  {open.linkedin && (
                    <a href={open.linkedin} target="_blank" rel="noreferrer" className="brutal-btn-outline !py-1.5 !px-3">
                      <ExternalLink className="w-3.5 h-3.5" /> Open profile
                    </a>
                  )}
                  <button type="button" onClick={() => mark(open.email, { linkedinSentAt: open.linkedinSentAt ? null : new Date().toISOString() }, open.linkedinSentAt ? "Marked as not sent" : "Marked as sent")} className="brutal-btn !py-1.5 !px-3">
                    {open.linkedinSentAt ? "Undo" : "Mark sent"}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
