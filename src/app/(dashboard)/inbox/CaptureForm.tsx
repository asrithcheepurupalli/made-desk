"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, Loader2, Link2, Film, Video, Globe, MessageSquare, FileText, ArrowRight } from "lucide-react";
import { processCaptureAction } from "./actions";
import type { SourceType } from "@/lib/data/types";

export function CaptureForm() {
  const [isPending, startTransition] = useTransition();
  const [sourceType, setSourceType] = useState<SourceType>("reel");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sourceTypes: { type: SourceType; label: string; icon: any }[] = [
    { type: "reel", label: "Instagram Reel", icon: Film },
    { type: "youtube", label: "YouTube Short/Vid", icon: Video },
    { type: "web", label: "Web / Article", icon: Globe },
    { type: "whatsapp", label: "WhatsApp Dump", icon: MessageSquare },
    { type: "note", label: "Raw Note", icon: FileText },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !sourceUrl.trim()) {
      setError("Please provide a Reel/YouTube link or paste notes.");
      return;
    }

    setError(null);
    setSuccess(false);

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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      }
    });
  };

  return (
    <div className="brutal-card p-6 bg-white mb-8">
      <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-4 mb-5">
        <div>
          <span className="label text-[#c8102e]">AI INGESTION PIPELINE</span>
          <h2 className="font-display font-black text-xl text-[#16130f] mt-1">
            New Knowledge Capture
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="label bg-[#ede8df] text-[#16130f] px-2 py-1 border border-[#16130f]">
            Gemini 2.5 Flash
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#fbe8eb] border-2 border-[#c8102e] text-[#c8102e] text-xs font-mono font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-[#f6f3ee] border-2 border-[#16130f] text-[#16130f] text-xs font-mono font-bold flex items-center justify-between">
            <span>✓ Capture processed and actionable tasks derived successfully.</span>
          </div>
        )}

        {/* Source Type Pills */}
        <div>
          <label className="label text-[#7c7770] block mb-2">Content Source</label>
          <div className="flex flex-wrap gap-2">
            {sourceTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = sourceType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSourceType(item.type)}
                  className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? "bg-[#16130f] text-white border-[#16130f] shadow-[2px_2px_0px_#c8102e]"
                      : "bg-[#f6f3ee] text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#c8102e]" : "text-[#16130f]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label text-[#7c7770]">
              Reel / Video URL (Automated Transcription + Keyframe Extraction)
            </label>
            <span className="text-[10px] font-mono text-[#c8102e] font-bold">
              Auto-downloads & grabs keyframe screenshots
            </span>
          </div>
          <div className="relative flex items-center">
            <Link2 className="w-4 h-4 text-[#7c7770] absolute left-3" />
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/... or https://youtube.com/..."
              className="w-full pl-9 pr-3 py-2 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-mono focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#c8102e]"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Raw Text Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label text-[#7c7770]">
              Raw Notes or Paste Transcript (Optional if URL provided)
            </label>
            <span className="text-[10px] font-mono text-[#7c7770]">
              Leave empty if providing a video URL above
            </span>
          </div>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste rough notes, transcript snippet, or WhatsApp text here. Or leave empty and provide a video URL above."
            className="w-full p-3 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-sans leading-relaxed focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#c8102e] resize-none"
            disabled={isPending}
          />
        </div>

        {/* Bottom submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] font-mono text-[#7c7770]">
            Automatic media extraction: yt-dlp + ffmpeg + Gemini audio transcription.
          </p>
          <button
            type="submit"
            className="brutal-btn-red text-xs py-2.5 px-5"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Media & Extracting SOP...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ingest & Extract Takeaways</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
