"use client";

import React from "react";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading } from "@/components/PageLoading";
import { listTrackedLinks } from "@/lib/data/trackedLinks";
import { Link2, MousePointerClick, Send, Clock, ExternalLink } from "lucide-react";

function timeAgo(iso?: string): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LinksPageClient() {
  const links = useStoreQuery(listTrackedLinks);
  if (!links) return <PageLoading />;

  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);
  const clickedCount = links.filter((l) => l.click_count > 0).length;
  const campaigns = new Set(links.map((l) => l.campaign).filter(Boolean)).size;

  const sorted = [...links].sort((a, b) => {
    const aTime = a.last_clicked_at || a.created_at;
    const bTime = b.last_clicked_at || b.created_at;
    return bTime.localeCompare(aTime);
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
      <div className="border-b-2 border-[#16130f] pb-6">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-[#c8102e]" />
          <span className="label text-[#7c7770]">Outbound Outreach / Click Analytics</span>
        </div>
        <h1 className="font-display font-semibold italic text-3xl md:text-4xl tracking-tight text-[#16130f] mt-1.5">
          Tracked Links
        </h1>
        <p className="font-sans text-xs text-[#7c7770] mt-2">
          Every proof link we send a lead, with who clicked and when, so follow up goes to who actually engaged.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="brutal-card p-4 bg-white">
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Total Links</span>
              <Send className="w-4 h-4 text-[#16130f]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1">{links.length}</p>
          </div>
          <div className="brutal-card p-4 bg-white">
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-[#c8102e]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1">{totalClicks}</p>
          </div>
          <div className="brutal-card p-4 bg-white">
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Clicked At Least Once</span>
              <Clock className="w-4 h-4 text-[#16130f]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1">{clickedCount}</p>
            <span className="text-[10px] font-mono text-[#7c7770] mt-0.5 block">
              {links.length ? Math.round((clickedCount / links.length) * 100) : 0}% of sent links
            </span>
          </div>
          <div className="brutal-card p-4 bg-white">
            <div className="flex items-center justify-between text-[#7c7770]">
              <span className="label">Campaigns</span>
              <Link2 className="w-4 h-4 text-[#16130f]" />
            </div>
            <p className="font-mono font-bold text-2xl text-[#16130f] mt-1">{campaigns}</p>
          </div>
        </div>
      </div>

      <div className="border-2 border-[#16130f] bg-white shadow-[2px_2px_0px_#16130f]">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 border-b-2 border-[#16130f] bg-[#ede8df]">
          <span className="label text-[#7c7770]">Contact / Campaign</span>
          <span className="label text-[#7c7770]">Clicks</span>
          <span className="label text-[#7c7770]">Last Clicked</span>
          <span className="label text-[#7c7770]">Target</span>
          <span className="label text-[#7c7770]">Short Link</span>
        </div>

        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-xs font-mono text-[#7c7770]">
            No tracked links yet.
          </div>
        )}

        {sorted.map((link) => (
          <div
            key={link.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-[#16130f]/10 items-center hover:bg-[#ede8df]/40"
          >
            <div>
              <p className="font-mono text-sm font-bold text-[#16130f]">
                {link.contact_name || link.label || link.code}
              </p>
              <p className="text-[10px] font-mono text-[#7c7770]">
                {link.campaign || "uncategorized"}
                {link.contact_phone ? ` · ${link.contact_phone}` : ""}
              </p>
            </div>
            <span
              className={`label px-1.5 py-0.5 border text-center ${
                link.click_count > 0
                  ? "bg-[#c8102e] text-white border-[#16130f]"
                  : "bg-white text-[#7c7770] border-[#16130f]/20"
              }`}
            >
              {link.click_count}
            </span>
            <span className="text-[11px] font-mono text-[#7c7770]">{timeAgo(link.last_clicked_at)}</span>
            <a
              href={link.target_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-[#16130f] truncate max-w-[180px] hover:text-[#c8102e] flex items-center gap-1"
              title={link.target_url}
            >
              <span className="truncate">{link.target_url.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <code className="text-[11px] font-mono bg-[#ede8df] px-1.5 py-0.5 border border-[#16130f]/20">
              /l/{link.code}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
