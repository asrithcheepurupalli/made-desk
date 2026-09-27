"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckSquare,
  BookOpen,
  Users,
  Bot,
  Sparkles,
  Plus,
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  Mail,
  CheckCircle2,
  Square,
  Clock,
  ChevronRight,
  Maximize2,
  TrendingUp,
  Flame,
  Layers,
  FileText,
  Search,
  Download,
} from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { PriorityBadge, StageBadge, CategoryBadge, RegionBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import type { Playbook, Client, NextAction, Capture, ActionStatus } from "@/lib/data/types";
import { toggleActionStatusHandler } from "@/app/(dashboard)/actions/actions";

interface DashboardOverviewProps {
  playbooks: Playbook[];
  clients: Client[];
  actions: NextAction[];
  captures: Capture[];
}

export function DashboardOverview({
  playbooks,
  clients,
  actions: initialActions,
  captures,
}: DashboardOverviewProps) {
  const { showToast } = useToast();
  const [actions, setActions] = useState<NextAction[]>(initialActions);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    setActions(initialActions);
  }, [initialActions]);

  const handleToggleDone = (action: NextAction) => {
    const nextStatus: ActionStatus = action.status === "done" ? "todo" : "done";
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, status: nextStatus } : a))
    );

    if (nextStatus === "done") {
      showToast(`✓ Completed task: "${action.title.slice(0, 30)}..."`, "success");
    }

    startTransition(async () => {
      await toggleActionStatusHandler(action.id, nextStatus);
    });
  };

  const urgentActions = actions.filter(
    (a) => a.status !== "done" && (a.priority === "urgent" || a.priority === "high")
  );
  const pendingActions = actions.filter((a) => a.status !== "done");
  const activeClients = clients.filter((c) => c.stage === "onboarding" || c.stage === "active");
  const processedCaptures = captures.filter((c) => c.status === "processed");

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Top Studio Mission Control Header */}
      <div className="border-b-2 border-[#16130f] pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e] border border-[#16130f] animate-pulse" />
              <span className="label text-[#c8102e] font-bold tracking-widest">
                STUDIO MISSION CONTROL
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1.5">
              <h1 className="font-display font-semibold italic text-3xl md:text-4xl tracking-tight text-[#16130f]">
                made<span className="not-italic text-[#c8102e]">.</span>
              </h1>
              <span className="font-mono text-sm uppercase font-bold tracking-widest px-2 py-0.5 border-2 border-[#16130f] bg-white shadow-[2px_2px_0px_#16130f]">
                Desk OS
              </span>
            </div>
            <p className="font-sans text-xs text-[#7c7770] mt-2">
              Central operating system, client pipelines, knowledge base, and actionable intelligence.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/inbox"
              className="brutal-btn-red text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Reel / Note</span>
            </Link>
            <Link
              href="/clients"
              className="brutal-btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client Workspace</span>
            </Link>
            <Link
              href="/assistant"
              className="brutal-btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-[#c8102e]" />
              <span>Ask AI</span>
            </Link>
          </div>
        </div>

        {/* Core KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Link
            href="/actions"
            className="brutal-card p-4 bg-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Open Next Actions</span>
              <Flame className="w-4 h-4 text-[#c8102e]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1 group-hover:text-[#c8102e] transition-colors">
              {pendingActions.length}
            </p>
            <span className="text-[10px] font-mono text-[#7c7770] mt-0.5 block">
              {urgentActions.length} urgent / high priority
            </span>
          </Link>

          <Link
            href="/clients"
            className="brutal-card p-4 bg-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Active Clients</span>
              <Users className="w-4 h-4 text-[#16130f]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1 group-hover:text-[#c8102e] transition-colors">
              {clients.length}
            </p>
            <span className="text-[10px] font-mono text-[#7c7770] mt-0.5 block">
              {activeClients.length} in active onboarding/build
            </span>
          </Link>

          <Link
            href="/playbooks"
            className="brutal-card p-4 bg-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Playbooks & SOPs</span>
              <BookOpen className="w-4 h-4 text-[#16130f]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1 group-hover:text-[#c8102e] transition-colors">
              {playbooks.length}
            </p>
            <span className="text-[10px] font-mono text-[#7c7770] mt-0.5 block">
              Living agency operational guides
            </span>
          </Link>

          <Link
            href="/inbox"
            className="brutal-card p-4 bg-white hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Reels / Research</span>
              <Inbox className="w-4 h-4 text-[#c8102e]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1 group-hover:text-[#c8102e] transition-colors">
              {captures.length}
            </p>
            <span className="text-[10px] font-mono text-[#7c7770] mt-0.5 block">
              {processedCaptures.length} processed with Gemini
            </span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Split: Urgent Next Actions & Client Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Urgent Task Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#c8102e]" />
              <h2 className="font-display font-bold text-lg text-[#16130f]">
                Urgent Action Queue ({urgentActions.length})
              </h2>
            </div>
            <Link
              href="/actions"
              className="text-xs font-mono font-bold text-[#c8102e] hover:underline flex items-center gap-1"
            >
              <span>View All ({actions.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {urgentActions.length === 0 ? (
              <div className="brutal-card p-8 bg-white text-center">
                <CheckCircle2 className="w-8 h-8 text-[#25d366] mx-auto mb-2" />
                <h4 className="font-display font-bold text-base text-[#16130f]">
                  No Urgent Tasks Pending
                </h4>
                <p className="font-sans text-xs text-[#7c7770] mt-1">
                  All urgent and high-priority action items are cleared. Ingest new reels or create client tasks.
                </p>
              </div>
            ) : (
              urgentActions.slice(0, 5).map((action) => (
                <div
                  key={action.id}
                  className="border-2 border-[#16130f] bg-white p-3.5 shadow-[2px_2px_0px_#16130f] flex items-start justify-between gap-3 hover:shadow-[3px_3px_0px_#16130f] transition-all"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleDone(action)}
                      className="mt-0.5 text-[#16130f] hover:text-[#c8102e] transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-xs font-bold text-[#16130f]">
                          {action.title}
                        </span>
                        <PriorityBadge priority={action.priority} />
                      </div>
                      {action.description && (
                        <p className="font-sans text-[11px] text-[#7c7770] line-clamp-1">
                          {action.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/actions"
                    className="text-[10px] font-mono text-[#7c7770] hover:text-[#16130f] underline shrink-0"
                  >
                    Manage
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Active Client Workspaces */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#16130f]" />
              <h2 className="font-display font-bold text-lg text-[#16130f]">
                Active Workspaces
              </h2>
            </div>
            <Link
              href="/clients"
              className="text-xs font-mono font-bold text-[#c8102e] hover:underline flex items-center gap-1"
            >
              <span>Pipeline Board</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="brutal-card p-8 bg-white text-center">
                <Users className="w-8 h-8 text-[#7c7770] mx-auto mb-2" />
                <h4 className="font-display font-bold text-base text-[#16130f]">
                  No Clients in Workspace
                </h4>
                <p className="font-sans text-xs text-[#7c7770] mt-1">
                  Add your active client projects or leads to track onboarding checklists.
                </p>
                <Link
                  href="/clients"
                  className="brutal-btn-outline text-xs py-1.5 px-3 mt-3 inline-block"
                >
                  + Add First Client
                </Link>
              </div>
            ) : (
              clients.slice(0, 4).map((client) => {
                const totalChecklist = client.onboarding_checklist?.length || 0;
                const completedCount =
                  client.onboarding_checklist?.filter((i) => i.completed).length || 0;

                return (
                  <div
                    key={client.id}
                    className="border-2 border-[#16130f] bg-white p-3.5 shadow-[2px_2px_0px_#16130f] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/clients/${client.slug}`}
                          className="font-display font-bold text-sm text-[#16130f] hover:text-[#c8102e] leading-tight block"
                        >
                          {client.company || client.name}
                        </Link>
                        {client.company && (
                          <p className="font-sans text-[11px] text-[#7c7770]">
                            {client.name} {client.contact_info?.role && `(${client.contact_info.role})`}
                          </p>
                        )}
                      </div>
                      <StageBadge stage={client.stage} />
                    </div>

                    {/* Onboarding Checklist progress */}
                    {totalChecklist > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#7c7770]">
                          <span>Onboarding Progress</span>
                          <span className="font-bold text-[#16130f]">
                            {completedCount}/{totalChecklist} steps
                          </span>
                        </div>
                        <div className="w-full bg-[#f6f3ee] border border-[#16130f] h-2">
                          <div
                            className="bg-[#c8102e] h-full transition-all"
                            style={{ width: `${(completedCount / totalChecklist) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#ede8df]">
                      <div className="flex items-center gap-1.5">
                        {client.contact_info?.whatsapp && (
                          <a
                            href={`https://wa.me/${client.contact_info.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-[#25d366]" />
                          </a>
                        )}
                        {client.contact_info?.email && (
                          <a
                            href={`mailto:${client.contact_info.email}`}
                            className="p-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] transition-colors"
                            title="Email"
                          >
                            <Mail className="w-3 h-3 text-[#16130f]" />
                          </a>
                        )}
                      </div>

                      <Link
                        href={`/clients/${client.slug}`}
                        className="text-[10px] font-mono font-bold text-[#16130f] hover:text-[#c8102e] flex items-center gap-0.5"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Research Stream & Featured Playbooks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t-2 border-[#16130f]">
        {/* Recent Ingested Captures */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#c8102e]" />
              <h2 className="font-display font-bold text-lg text-[#16130f]">
                Recent Ingestion Stream
              </h2>
            </div>
            <Link
              href="/inbox"
              className="text-xs font-mono font-bold text-[#c8102e] hover:underline flex items-center gap-1"
            >
              <span>Inbox Stream</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {captures.length === 0 ? (
              <div className="brutal-card p-8 bg-white text-center">
                <Sparkles className="w-8 h-8 text-[#c8102e] mx-auto mb-2" />
                <h4 className="font-display font-bold text-base text-[#16130f]">
                  No Captures Ingested Yet
                </h4>
                <p className="font-sans text-xs text-[#7c7770] mt-1">
                  Paste Instagram Reels or YouTube URLs into the Capture Inbox to auto-extract screenshots and SOP takeaways.
                </p>
                <Link
                  href="/inbox"
                  className="brutal-btn-red text-xs py-1.5 px-3 mt-3 inline-block"
                >
                  + Ingest Reel / Note
                </Link>
              </div>
            ) : (
              captures.slice(0, 3).map((cap) => (
                <div
                  key={cap.id}
                  className="brutal-card p-4 bg-white space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-[#ede8df] pb-2">
                    <span className="label text-[#16130f]">{cap.source_type} capture</span>
                    {cap.suggested_category && (
                      <span className="label bg-[#ede8df] px-1.5 py-0.5 border border-[#16130f]">
                        {cap.suggested_category}
                      </span>
                    )}
                  </div>

                  {/* Thumbnails if present */}
                  {cap.screenshots && cap.screenshots.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {cap.screenshots.slice(0, 4).map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(src)}
                          className="aspect-9/16 border border-[#16130f] bg-[#16130f] overflow-hidden"
                        >
                          <img
                            src={src}
                            alt="Keyframe preview"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="font-sans text-xs text-[#16130f] font-semibold line-clamp-2 leading-relaxed">
                    {cap.summary || cap.raw_text.slice(0, 80) + "..."}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#7c7770] pt-1">
                    <span>{cap.extracted_insights?.length || 0} takeaways</span>
                    <Link
                      href="/inbox"
                      className="text-[#c8102e] font-bold hover:underline"
                    >
                      View in Inbox →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Featured Playbooks & SOPs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#16130f]" />
              <h2 className="font-display font-bold text-lg text-[#16130f]">
                Featured Playbooks & SOPs
              </h2>
            </div>
            <Link
              href="/playbooks"
              className="text-xs font-mono font-bold text-[#c8102e] hover:underline flex items-center gap-1"
            >
              <span>Library ({playbooks.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {playbooks.length === 0 ? (
              <div className="brutal-card p-8 bg-white text-center">
                <BookOpen className="w-8 h-8 text-[#7c7770] mx-auto mb-2" />
                <h4 className="font-display font-bold text-base text-[#16130f]">
                  No Playbooks Created
                </h4>
                <p className="font-sans text-xs text-[#7c7770] mt-1">
                  Promote reel captures into living SOPs or draft your first client acquisition guide.
                </p>
                <Link
                  href="/playbooks"
                  className="brutal-btn-outline text-xs py-1.5 px-3 mt-3 inline-block"
                >
                  + Create First Playbook
                </Link>
              </div>
            ) : (
              playbooks.slice(0, 3).map((playbook) => (
                <Link
                  key={playbook.id}
                  href={`/playbooks/${playbook.slug}`}
                  className="brutal-card p-4 bg-white block hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <CategoryBadge category={playbook.category} />
                    {playbook.region && <RegionBadge region={playbook.region} />}
                  </div>
                  <h3 className="font-display font-bold text-base text-[#16130f] group-hover:text-[#c8102e] transition-colors leading-snug">
                    {playbook.title}
                  </h3>
                  {playbook.summary && (
                    <p className="font-sans text-xs text-[#7c7770] line-clamp-2 mt-1 leading-relaxed">
                      {playbook.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7c7770] pt-2 mt-2 border-t border-[#ede8df]">
                    <span>{Array.isArray(playbook.content) ? playbook.content.length : 0} editor blocks</span>
                    <span className="group-hover:text-[#c8102e] font-bold">Open SOP →</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-[#16130f]/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white border-3 border-[#16130f] shadow-[6px_6px_0px_#16130f] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2 mb-3">
              <span className="label text-[#c8102e]">KEYFRAME PREVIEW</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 border border-[#16130f] bg-[#f6f3ee]"
              >
                ✕
              </button>
            </div>
            <div className="border-2 border-[#16130f] bg-[#16130f]">
              <img
                src={selectedImage}
                alt="Enlarged keyframe"
                className="max-h-[75vh] w-auto mx-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
