"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Film,
  Video,
  Globe,
  MessageSquare,
  FileText,
  ExternalLink,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  Image as ImageIcon,
  X,
  Maximize2,
} from "lucide-react";
import { promoteCaptureToPlaybookAction, deleteCaptureAction } from "./actions";
import type { Capture, SourceType } from "@/lib/data/types";

export function CaptureCard({ capture }: { capture: Capture }) {
  const router = useRouter();
  const [showRaw, setShowRaw] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPromoting, startPromote] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const sourceIcons: Record<SourceType, any> = {
    reel: Film,
    youtube: Video,
    web: Globe,
    whatsapp: MessageSquare,
    note: FileText,
  };

  const Icon = sourceIcons[capture.source_type] || FileText;

  const handlePromote = () => {
    startPromote(async () => {
      const res = await promoteCaptureToPlaybookAction(capture.id);
      if (res.success && res.slug) {
        router.push(`/playbooks/${res.slug}`);
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this capture?")) {
      startDelete(async () => {
        await deleteCaptureAction(capture.id);
      });
    }
  };

  const formattedDate = new Date(capture.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="brutal-card bg-white p-5 flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#16130f] pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 border-2 border-[#16130f] bg-[#f6f3ee] flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-[#16130f]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="label text-[#16130f]">
                    {capture.source_type} capture
                  </span>
                  {capture.duration_seconds && (
                    <span className="text-[10px] font-mono text-[#7c7770] font-bold bg-[#ede8df] px-1.5 py-0.2 border border-[#16130f]">
                      {capture.duration_seconds}s
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7c7770] mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {capture.suggested_category && (
                <span className="label bg-[#ede8df] text-[#16130f] px-2 py-0.5 border border-[#16130f]">
                  {capture.suggested_category}
                </span>
              )}
              {capture.status === "processed" ? (
                <span className="label bg-[#16130f] text-[#f6f3ee] px-2 py-0.5 border border-[#16130f] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#c8102e]" />
                  PROCESSED
                </span>
              ) : (
                <span className="label bg-[#bd9b4e] text-white px-2 py-0.5 border border-[#16130f]">
                  {capture.status}
                </span>
              )}
            </div>
          </div>

          {/* Source Link if present */}
          {capture.source_url && (
            <a
              href={capture.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#c8102e] hover:underline mb-3 truncate max-w-full"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{capture.source_url}</span>
            </a>
          )}

          {/* Extracted Keyframe Screenshots Gallery */}
          {capture.screenshots && capture.screenshots.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label text-[#7c7770] flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-[#c8102e]" />
                  Keyframe Screenshots ({capture.screenshots.length})
                </span>
                <span className="text-[10px] font-mono text-[#7c7770]">Click to expand</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {capture.screenshots.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(src)}
                    className="relative group aspect-9/16 border-2 border-[#16130f] bg-[#16130f] overflow-hidden hover:shadow-[2px_2px_0px_#c8102e] transition-all"
                  >
                    <img
                      src={src}
                      alt={`Keyframe ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {capture.summary && (
            <div className="mb-4">
              <p className="font-sans text-xs text-[#16130f] font-semibold leading-relaxed">
                {capture.summary}
              </p>
            </div>
          )}

          {/* Extracted Takeaways */}
          {capture.extracted_insights && capture.extracted_insights.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <p className="label text-[#7c7770]">Extracted Key Takeaways</p>
              <ul className="space-y-1">
                {capture.extracted_insights.map((insight: any, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-sans text-[#16130f] flex items-start gap-2 bg-[#f6f3ee] p-2 border border-[#16130f]"
                  >
                    <span className="text-[#c8102e] font-mono font-bold">›</span>
                    <span>{typeof insight === "string" ? insight : insight.takeaway || insight.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Raw Transcript */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="text-[11px] font-mono text-[#7c7770] hover:text-[#16130f] flex items-center gap-1 underline underline-offset-2"
            >
              {showRaw ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Raw Content</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>View Raw Transcript ({capture.raw_text.length} chars)</span>
                </>
              )}
            </button>

            {showRaw && (
              <div className="mt-2 p-3 bg-[#f6f3ee] border border-[#16130f] text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed text-[#16130f]">
                {capture.raw_text}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-4 mt-4 border-t-2 border-[#16130f] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePromote}
            disabled={isPromoting}
            className="brutal-btn-outline text-[11px] py-1.5 px-3 flex items-center gap-1.5"
          >
            {isPromoting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating SOP...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[#c8102e]" />
                <span>Promote to Playbook SOP</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 hover:bg-[#fbe8eb] text-[#7c7770] hover:text-[#c8102e] border border-transparent hover:border-[#c8102e] transition-colors"
            title="Delete capture"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-[#16130f]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white border-3 border-[#16130f] shadow-[6px_6px_0px_#16130f] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2 mb-3">
              <span className="label text-[#c8102e]">KEYFRAME VISUAL INSPECTION</span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 border border-[#16130f] bg-[#f6f3ee] hover:bg-[#ede8df]"
              >
                <X className="w-4 h-4 text-[#16130f]" />
              </button>
            </div>
            <div className="border-2 border-[#16130f] bg-[#16130f] overflow-hidden flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Enlarged keyframe"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
