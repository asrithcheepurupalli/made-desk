"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, Undo2, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { previewCleanup, applyCleanup, getCleanupBackup, undoCleanup, type CleanupPreview, type CleanupBackup } from "@/lib/tasks/cleanup";

export function TaskCleanup({ openCount }: { openCount: number }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [backup, setBackup] = useState<CleanupBackup | null>(null);

  const refreshBackup = () => getCleanupBackup().then(setBackup);
  useEffect(() => {
    refreshBackup();
  }, []);

  const start = async () => {
    setBusy(true);
    try {
      const p = await previewCleanup();
      if (p.removals.length === 0) {
        showToast("Nothing to clean up: every open task looks specific.", "info");
      } else {
        setPreview(p);
        setChecked(new Set(p.removals.map((r) => r.task.id)));
      }
    } catch {
      showToast("Could not analyse tasks. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const n = await applyCleanup([...checked]);
      showToast(`Removed ${n} tasks. You can undo this.`, "success");
      setPreview(null);
      await refreshBackup();
    } catch {
      showToast("Cleanup failed. Nothing was removed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    const n = await undoCleanup();
    showToast(`Restored ${n} tasks.`, "success");
    await refreshBackup();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || openCount === 0}
          onClick={start}
          className="inline-flex items-center gap-2 bg-[#16130f] text-[#f6f3ee] font-mono text-xs uppercase px-4 py-2 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors disabled:opacity-50"
        >
          {busy && !preview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy && !preview ? "Analysing..." : "Clean up tasks"}
        </button>
        {backup && (
          <button type="button" onClick={undo} className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase underline text-[#7c7770] hover:text-[#c8102e]">
            <Undo2 className="w-3.5 h-3.5" /> Undo last cleanup ({backup.removed} removed)
          </button>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#f6f3ee] border-2 border-[#16130f] shadow-[6px_6px_0px_#16130f] w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 p-5 border-b-2 border-[#16130f] bg-white">
              <div>
                <h3 className="font-display font-black text-xl text-[#16130f]">Clean up tasks</h3>
                <p className="font-sans text-xs text-[#7c7770] mt-1">
                  Remove {checked.size} of {preview.removals.length} suggested. Keeping {preview.kept}
                  {preview.protectedCount ? ` (${preview.protectedCount} manual, in-progress, or done are never touched)` : ""}.
                  {!preview.usedAi && " AI was unavailable, so only obvious filler and duplicates are listed."}
                </p>
              </div>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-1.5">
              {preview.removals.map(({ task, reason }) => (
                <label key={task.id} className="flex items-start gap-3 p-2.5 bg-white border border-[#16130f] cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#c8102e]"
                    checked={checked.has(task.id)}
                    onChange={(e) => {
                      const next = new Set(checked);
                      if (e.target.checked) next.add(task.id);
                      else next.delete(task.id);
                      setChecked(next);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block font-sans text-xs font-semibold text-[#16130f]">{task.title}</span>
                    <span className="block font-mono text-[10px] text-[#7c7770]">{reason}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 p-4 border-t-2 border-[#16130f] bg-white">
              <button type="button" onClick={() => setPreview(null)} className="font-mono text-xs uppercase underline text-[#7c7770]">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || checked.size === 0}
                onClick={apply}
                className="bg-[#c8102e] text-white font-mono text-xs uppercase px-4 py-2 border-2 border-[#16130f] shadow-[2px_2px_0px_#16130f] disabled:opacity-50"
              >
                {busy ? "Removing..." : `Remove ${checked.size} tasks`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
