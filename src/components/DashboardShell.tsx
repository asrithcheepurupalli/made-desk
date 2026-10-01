"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { QuickCaptureModal } from "./QuickCaptureModal";
import { requestPersistentStorage } from "@/lib/store/backup";
import { ToastProvider } from "./Toast";
import { Command, X, Keyboard, Menu } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  React.useEffect(() => {
    requestPersistentStorage();
    // Catch up: merge any new overlapping SOPs (cheap no-op when nothing changed)
    import("@/lib/data/products").then((m) => m.ensureProductSeed()).catch(() => {});
    import("@/lib/masters/sync").then((m) => m.scheduleMasterSync(2500)).catch(() => {});
  }, []);

  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

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
        <Sidebar
          open={navOpen}
          onClose={() => setNavOpen(false)}
          onOpenQuickCapture={() => {
            setNavOpen(false);
            setIsQuickCaptureOpen(true);
          }}
        />
        {navOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setNavOpen(false)} aria-hidden />}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-[#f6f3ee] transition-opacity duration-200">
          {/* Phone-sized screens: top bar with the menu button */}
          <div className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b-2 border-[#16130f] bg-white">
            <button type="button" onClick={() => setNavOpen(true)} aria-label="Open menu" className="p-1 -ml-1">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-display italic font-semibold text-xl">
              made<span className="text-[#c8102e] not-italic">.</span> <span className="font-mono not-italic text-[10px] uppercase border border-[#16130f] px-1 align-middle">desk</span>
            </span>
            <span className="w-6" />
          </div>
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
                  <span>Master SOPs</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">5</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Client Workspace</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">6</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Grounded AI Assistant</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">7</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Hall of Products</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">8</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f6f3ee] border border-[#16130f]">
                  <span>Outreach Board</span>
                  <kbd className="px-2 py-0.5 bg-white border border-[#16130f] font-bold">9</kbd>
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
