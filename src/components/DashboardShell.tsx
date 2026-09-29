"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { QuickCaptureModal } from "./QuickCaptureModal";
import { ToastProvider } from "./Toast";
import { Command, X, Keyboard } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  ephemeral?: boolean;
}

export function DashboardShell({ children, ephemeral }: DashboardShellProps) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#f6f3ee] text-[#16130f] overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f6f3ee] transition-opacity duration-200">
          {ephemeral && (
            <div className="border-b-2 border-[#16130f] bg-[#c8102e] text-white px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Temporary storage: data will not survive a refresh or redeploy. Add SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to make it permanent.
            </div>
          )}
          {children}
        </main>

        {/* Global Quick Capture Modal (triggered via Cmd+K or sidebar button) */}
        <QuickCaptureModal
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
        />

        {/* Keyboard Shortcuts HUD (triggered via ?) */}
        {isShortcutsOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#16130f]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setIsShortcutsOpen(false)}
          >
            <div
              className="relative max-w-md w-full bg-white border-3 border-[#16130f] shadow-[6px_6px_0px_#16130f] p-6 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#c8102e]" />
                  <span className="label text-[#16130f]">STUDIO HOTKEYS</span>
                </div>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1 hover:bg-[#f6f3ee] border border-[#16130f]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Global Quick Capture</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">⌘K</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Mission Control</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">1</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Capture Inbox</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">2</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Next Actions</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">3</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Playbooks & SOPs</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">4</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Client Workspace</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">5</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Grounded AI Assistant</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">6</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Keyboard Shortcuts Help</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">?</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}
