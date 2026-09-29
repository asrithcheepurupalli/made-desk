"use client";

import React from "react";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading } from "@/components/PageLoading";
import { listPlaybooks } from "@/lib/data/playbooks";
import { PlaybooksList } from "./PlaybooksList";
import { BookOpen, Layers, Sparkles } from "lucide-react";



export function PlaybooksPageClient() {
  const playbooks = useStoreQuery(listPlaybooks);
  if (!playbooks) return <PageLoading />;

  const acquisitionCount = playbooks.filter((p) => p.category === "acquisition").length;
  const onboardingCount = playbooks.filter((p) => p.category === "onboarding").length;
  const outreachCount = playbooks.filter((p) => p.category === "outreach").length;

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Top Header & Metrics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#c8102e]" />
              <span className="label text-[#7c7770]">Pillar 02 / Operational Intelligence</span>
            </div>
            <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">
              Agency Playbooks & SOPs
            </h1>
            <p className="font-sans text-xs text-[#7c7770] mt-1">
              Living, editable Notion-style operational guides for outreach, client onboarding, pricing models, and regional execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Total Guides</p>
              <p className="font-mono font-bold text-xl text-[#16130f]">{playbooks.length}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Acquisition / Outreach</p>
              <p className="font-mono font-bold text-xl text-[#c8102e]">{acquisitionCount + outreachCount}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Onboarding</p>
              <p className="font-mono font-bold text-xl text-[#bd9b4e]">{onboardingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <PlaybooksList initialPlaybooks={playbooks} />
    </div>
  );
}
