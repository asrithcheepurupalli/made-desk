"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, Link2, FileText, Film, Video, Globe, MessageSquare } from "lucide-react";
import { processCaptureAction } from "@/app/(dashboard)/inbox/actions";
import type { SourceType } from "@/lib/data/types";

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCaptureModal({ isOpen, onClose }: QuickCaptureModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sourceType, setSourceType] = useState<SourceType>("reel");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceTypes: { type: SourceType; label: string; icon: any }[] = [
    { type: "reel", label: "Reel / Short", icon: Film },
    { type: "youtube", label: "YouTube", icon: Video },
    { type: "web", label: "Web Article", icon: Globe },
    { type: "whatsapp", label: "WhatsApp Dump", icon: MessageSquare },
    { type: "note", label: "Raw Note", icon: FileText },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError("Please paste or type the transcript or notes first.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("raw_text", rawText);
      if (sourceUrl) formData.append("source_url", sourceUrl);
      formData.append("source_type", sourceType);

      const res = await processCaptureAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setRawText("");
        setSourceUrl("");
        onClose();
        router.push("/inbox");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white border-2 border-[#16130f] shadow-[6px_6px_0px_#16130f] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-[#f6f3ee] border-b-2 border-[#16130f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#c8102e] border border-[#16130f] inline-block" />
            <h2 className="font-display font-bold text-base text-[#16130f] uppercase tracking-wide">
              Quick Capture & AI Ingestion
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#ede8df] border border-transparent hover:border-[#16130f] transition-all"
            disabled={isPending}
          >
            <X className="w-5 h-5 text-[#16130f]" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#fbe8eb] border-2 border-[#c8102e] text-[#c8102e] text-xs font-mono font-bold">
              {error}
            </div>
          )}

          {/* Source Type Selector */}
          <div>
            <label className="label text-[#7c7770] block mb-2">Source Type</label>
            <div className="grid grid-cols-5 gap-2">
              {sourceTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = sourceType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSourceType(item.type)}
                    className={`flex flex-col items-center justify-center p-2.5 border-2 text-[11px] font-mono font-bold transition-all ${
                      isSelected
                        ? "bg-[#16130f] text-white border-[#16130f] shadow-[2px_2px_0px_#c8102e]"
                        : "bg-[#f6f3ee] text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? "text-[#c8102e]" : "text-[#16130f]"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source URL (optional) */}
          <div>
            <label className="label text-[#7c7770] block mb-1">
              Source URL (Optional link to Reel, Video, or Article)
            </label>
            <div className="relative flex items-center">
              <Link2 className="w-4 h-4 text-[#7c7770] absolute left-3" />
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://instagram.com/reel/... or https://youtube.com/..."
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#16130f] text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#c8102e]"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Raw Text / Transcript Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label text-[#7c7770]">
                Transcript / Raw Ideas / Workflow Dump
              </label>
              <span className="label text-[#c8102e]">AI Extraction Ready</span>
            </div>
            <textarea
              required
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw transcript, voice note transcription, or dump notes from Instagram reel/YouTube here. Gemini AI will extract actionable takeaways, create Next Actions, and prepare SOP drafts..."
              className="w-full p-3 bg-white border-2 border-[#16130f] text-xs font-sans leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#c8102e] resize-none"
              disabled={isPending}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between border-t-2 border-[#ede8df]">
            <span className="text-[11px] font-mono text-[#7c7770]">
              Press <kbd className="border border-[#16130f] px-1 py-0.5 bg-[#f6f3ee]">ESC</kbd> to cancel
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="brutal-btn-outline text-xs py-2"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="brutal-btn-red text-xs py-2 min-w-[140px]"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ingest & Extract</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
