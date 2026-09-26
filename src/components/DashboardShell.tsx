"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { QuickCaptureModal } from "./QuickCaptureModal";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f6f3ee] text-[#16130f] overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar onOpenQuickCapture={() => setIsQuickCaptureOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f6f3ee]">
        {children}
      </main>

      {/* Global Quick Capture Modal (triggered via Cmd+K or sidebar button) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />
    </div>
  );
}
