import React from "react";
import { listCaptures } from "@/lib/data/captures";
import { listNextActions } from "@/lib/data/actions";
import { CaptureForm } from "./CaptureForm";
import { CaptureCard } from "./CaptureCard";
import { Inbox, Sparkles, CheckSquare, Layers } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Capture Inbox: made. desk",
};

export default async function InboxPage() {
  const [captures, actions] = await Promise.all([
    listCaptures(),
    listNextActions(),
  ]);

  const processedCount = captures.filter((c) => c.status === "processed").length;
  const derivedActionsCount = actions.filter((a) => a.source_capture_id).length;

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Top Header & Metrics Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#c8102e]" />
              <span className="label text-[#7c7770]">Pillar 01 / Ingestion Engine</span>
            </div>
            <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">
              Capture Inbox
            </h1>
            <p className="font-sans text-xs text-[#7c7770] mt-1">
              Dump reels, video transcripts, and tactical notes here. Gemini extracts actionable insights and populates Next Actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-[#16130f] px-4 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Total Ingested</p>
              <p className="font-mono font-bold text-xl text-[#16130f]">{captures.length}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-4 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Derived Actions</p>
              <p className="font-mono font-bold text-xl text-[#c8102e]">{derivedActionsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form for Ingestion */}
      <CaptureForm />

      {/* Captures Stream List */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#16130f]" />
            <h3 className="font-display font-bold text-lg text-[#16130f]">
              Captured Knowledge Stream ({captures.length})
            </h3>
          </div>
          <span className="label text-[#7c7770]">
            {processedCount} Processed with AI
          </span>
        </div>

        {captures.length === 0 ? (
          <div className="brutal-card p-12 bg-white text-center">
            <Sparkles className="w-8 h-8 text-[#c8102e] mx-auto mb-3" />
            <h4 className="font-display font-bold text-base text-[#16130f] mb-1">
              Inbox is Empty
            </h4>
            <p className="font-sans text-xs text-[#7c7770] max-w-md mx-auto">
              Paste your first reel transcript, voice note, or research link above. Gemini will parse it into operational SOPs and next steps.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {captures.map((capture) => (
              <CaptureCard key={capture.id} capture={capture} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
