"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Layers, History } from "lucide-react";
import { useStoreQuery } from "@/lib/store/useStore";
import { getMasterBySlug } from "@/lib/data/masters";
import { listPlaybooks } from "@/lib/data/playbooks";
import { syncMasters } from "@/lib/masters/sync";
import { BlockEditor } from "@/components/Editor/BlockEditor";
import { PageLoading, NotFoundInStore } from "@/components/PageLoading";
import { MastersStatusLine } from "@/components/MastersStatus";
import { CategoryBadge, RegionBadge } from "@/components/StatusBadge";

export function MasterDetailClient({ slug }: { slug: string }) {
  const state = useStoreQuery(async () => {
    const master = await getMasterBySlug(slug);
    const playbooks = master ? await listPlaybooks() : [];
    return { master, playbooks };
  });
  const [busy, setBusy] = useState(false);

  if (!state) return <PageLoading />;
  if (!state.master) return <NotFoundInStore what="master SOP" href="/masters" label="Back to master SOPs" />;

  const m = state.master;
  const byId = new Map(state.playbooks.map((p) => [p.id, p]));

  const remerge = async () => {
    setBusy(true);
    await syncMasters({ force: true, onlyMasterId: m.id });
    setBusy(false);
  };

  return (
    <div className="p-8 max-w-5xl w-full mx-auto space-y-8">
      <Link href="/masters" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-[#7c7770] hover:text-[#c8102e]">
        <ArrowLeft className="w-3.5 h-3.5" /> All master SOPs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-[#c8102e]" />
            <CategoryBadge category={m.category} />
            <RegionBadge region={m.region} />
            <span className="label bg-[#16130f] text-[#f6f3ee] px-2 py-0.5 border border-[#16130f]">v{m.version}</span>
          </div>
          <p className="font-sans text-xs text-[#7c7770]">
            Auto-merged from {m.source_playbook_ids.length} SOPs. Read-only: it rebuilds itself when its sources change.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={remerge}
            className="inline-flex items-center gap-2 bg-[#16130f] text-[#f6f3ee] font-mono text-xs uppercase px-4 py-2 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Re-merging..." : "Re-merge now"}
          </button>
          <MastersStatusLine />
        </div>
      </div>

      <div className="brutal-card bg-white p-6">
        <BlockEditor key={`${m.id}-${m.version}`} initialBlocks={m.content} readOnly />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="brutal-card bg-white p-5">
          <h3 className="font-display font-bold text-base text-[#16130f] mb-3">Merged from</h3>
          <ul className="space-y-2">
            {m.source_playbook_ids.map((id) => {
              const p = byId.get(id);
              return (
                <li key={id} className="font-sans text-xs">
                  {p ? (
                    <Link href={`/playbooks/${p.slug}`} className="text-[#c8102e] hover:underline">
                      {p.title}
                    </Link>
                  ) : (
                    <span className="text-[#7c7770] line-through">Deleted SOP</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="brutal-card bg-white p-5">
          <h3 className="font-display font-bold text-base text-[#16130f] mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Changelog
          </h3>
          <ul className="space-y-3">
            {m.changelog.map((c, i) => (
              <li key={i} className="font-sans text-xs text-[#16130f]">
                <span className="font-mono text-[10px] text-[#7c7770] block">{new Date(c.at).toLocaleString()}</span>
                {c.summary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
