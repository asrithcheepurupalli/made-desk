"use client";

import { exportBackup, importBackup } from "@/lib/store/backup";
import { ClaudeLink } from "./ClaudeLink";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  BookOpen,
  Layers,
  Users,
  Bot,
  Plus,
} from "lucide-react";
import { STUDIO } from "@/lib/brand";
import { Wordmark } from "./Wordmark";

interface SidebarProps {
  onOpenQuickCapture?: () => void;
}

export function Sidebar({ onOpenQuickCapture }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      href: "/dashboard",
      label: "Mission Control",
      icon: LayoutDashboard,
      shortcut: "1",
    },
    {
      href: "/inbox",
      label: "Capture Inbox",
      icon: Inbox,
      shortcut: "2",
    },
    {
      href: "/actions",
      label: "Next Actions",
      icon: CheckSquare,
      shortcut: "3",
    },
    {
      href: "/playbooks",
      label: "Playbooks & SOPs",
      icon: BookOpen,
      shortcut: "4",
    },
    {
      href: "/masters",
      label: "Master SOPs",
      icon: Layers,
      shortcut: "5",
    },
    {
      href: "/clients",
      label: "Client Workspace",
      icon: Users,
      shortcut: "6",
    },
    {
      href: "/assistant",
      label: "Grounded AI",
      icon: Bot,
      shortcut: "7",
    },
  ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenQuickCapture?.();
        return;
      }

      if (e.key === "1") router.push("/dashboard");
      if (e.key === "2") router.push("/inbox");
      if (e.key === "3") router.push("/actions");
      if (e.key === "4") router.push("/playbooks");
      if (e.key === "5") router.push("/masters");
      if (e.key === "6") router.push("/clients");
      if (e.key === "7") router.push("/assistant");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, onOpenQuickCapture]);

  return (
    <aside className="w-64 border-r-2 border-[#16130f] bg-[#f6f3ee] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b-2 border-[#16130f] flex items-center justify-between bg-white">
          <div>
            <Wordmark word="made" sub="desk" href="/dashboard" className="text-xl" />
            <p className="label text-[#7c7770] mt-1">{STUDIO}</p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#c8102e] border border-[#16130f] animate-pulse" title="System Live" />
        </div>

        {/* Quick Capture Button */}
        <div className="p-4 border-b-2 border-[#16130f]">
          <button
            onClick={onOpenQuickCapture}
            className="w-full brutal-btn-red flex items-center justify-between text-xs py-2.5"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Capture Reel / Note</span>
            </span>
            <kbd className="label text-[9px] bg-[#16130f] text-white px-1.5 py-0.5 border border-white/20">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          <p className="label text-[#7c7770] px-3 py-2">Navigation</p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 border-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-[#16130f] text-[#f6f3ee] border-[#16130f] shadow-[2px_2px_0px_#c8102e]"
                    : "bg-white text-[#16130f] border-transparent hover:border-[#16130f] hover:bg-[#ede8df]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#c8102e]" : "text-[#16130f]"}`} />
                  <span>{item.label}</span>
                </div>
                <kbd
                  className={`text-[9px] font-mono px-1 py-0.2 border ${
                    isActive
                      ? "border-white/30 text-white/70"
                      : "border-[#16130f]/20 text-[#7c7770]"
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status */}
      <div className="p-4 border-t-2 border-[#16130f] bg-white space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
          <span>AI Engine</span>
          <span className="label text-[#16130f] bg-[#ede8df] px-1.5 py-0.5 border border-[#16130f]">
            Gemini Flash
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
          <span>Storage</span>
          <span className="label text-[#16130f] bg-[#ede8df] px-1.5 py-0.5 border border-[#16130f]">
            This browser
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => exportBackup()}
            className="border-2 border-[#16130f] bg-white px-2 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-[#ede8df] transition-colors"
          >
            Export
          </button>
          <label className="border-2 border-[#16130f] bg-white px-2 py-1.5 font-mono text-[10px] font-bold uppercase text-center cursor-pointer hover:bg-[#ede8df] transition-colors">
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  const n = await importBackup(file);
                  alert(`Restored ${n} records from backup.`);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Could not import that file.");
                }
              }}
            />
          </label>
        </div>
        <ClaudeLink />
        <div className="flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
          <span>Studio Mode</span>
          <span className="label text-[#c8102e] font-bold">OPERATIONAL</span>
        </div>
      </div>
    </aside>
  );
}
