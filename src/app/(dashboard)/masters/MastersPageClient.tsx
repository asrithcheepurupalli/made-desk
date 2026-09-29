"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Layers, RefreshCw, ArrowUpRight, GitMerge } from "lucide-react";
import { useStoreQuery } from "@/lib/store/useStore";
import { listMasters } from "@/lib/data/masters";
import { listPlaybooks } from "@/lib/data/playbooks";
import { syncMasters } from "@/lib/masters/sync";
import { PageLoading } from "@/components/PageLoading";
import { MastersStatusLine } from "@/components/MastersStatus";
import { CategoryBadge, RegionBadge } from "@/components/StatusBadge";

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}

export function MastersPageClient() {
  const data = useStoreQuery(async () => {
    const [masters, playbooks] = await Promise.all([listMasters(), listPlaybooks()]);
    return { masters, playbooks };
  });
  const [busy, setBusy] = useState(false);
  if (!data) return <PageLoading />;
  const { masters, playbooks } = data;
  const merged = new Set(masters.flatMap((m) => m.source_playbook_ids));
  const standalone = playbooks.filter((p) => !merged.has(p.id)).length;

  const run = async () => {
    setBusy(true);
    await syncMasters({ force: true });
    setBusy(false);
  };

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#c8102e]" />
            <span className="label text-[#7c7770]">Pillar 02b / Consolidated Knowledge</span>
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">Master SOPs</h1>
          <p className="font-sans text-xs text-[#7c7770] mt-1 max-w-xl">
            Overlapping SOPs merged into one canonical page per job. Each page updates itself when a similar SOP arrives, and keeps a changelog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
            <p className="label text-[#7c7770]">Masters</p>
            <p className="font-mono font-bold text-xl text-[#c8102e]">{masters.length}</p>
          </div>
          <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
            <p className="label text-[#7c7770]">SOPs merged</p>
            <p className="font-mono font-bold text-xl text-[#16130f]">{merged.size}</p>
          </div>
          <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
            <p className="label text-[#7c7770]">Standalone</p>
            <p className="font-mono font-bold text-xl text-[#16130f]">{standalone}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <MastersStatusLine />
        <button
          type="button"
          disabled={busy}
          onClick={run}
          className="ml-auto inline-flex items-center gap-2 bg-[#16130f] text-[#f6f3ee] font-mono text-xs uppercase px-4 py-2 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Merging..." : "Merge now"}
        </button>
      </div>

      {masters.length === 0 ? (
        <div className="brutal-card p-12 bg-white text-center">
          <GitMerge className="w-8 h-8 text-[#c8102e] mx-auto mb-3" />
          <h4 className="font-display font-bold text-base text-[#16130f] mb-1">No overlapping SOPs merged yet</h4>
          <p className="font-sans text-xs text-[#7c7770] max-w-md mx-auto">
            {playbooks.length < 2
              ? "Once you have two or more SOPs on the same job, they are merged here automatically."
              : "Click Merge now to group the SOPs that cover the same job. After that it runs by itself whenever a new SOP is added."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {masters.map((m) => (
            <Link
              key={m.id}
              href={`/masters/${m.slug}`}
              className="brutal-card bg-white p-5 flex flex-col gap-3 hover:shadow-[4px_4px_0px_#c8102e] transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-[#16130f] leading-snug">{m.title}</h3>
                <ArrowUpRight className="w-4 h-4 text-[#c8102e] shrink-0 mt-1" />
              </div>
              <p className="font-sans text-xs text-[#7c7770] leading-relaxed line-clamp-3">{m.summary}</p>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={m.category} />
                <RegionBadge region={m.region} />
                <span className="label bg-[#ede8df] text-[#16130f] px-2 py-0.5 border border-[#16130f]">
                  {m.source_playbook_ids.length} SOPs merged
                </span>
                <span className="label bg-[#16130f] text-[#f6f3ee] px-2 py-0.5 border border-[#16130f]">v{m.version}</span>
              </div>
              {m.changelog[0] && (
                <p className="font-mono text-[10px] text-[#7c7770] border-t border-[#e4ddd0] pt-2">
                  Updated {ago(m.changelog[0].at)}: {m.changelog[0].summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
