"use client";

import React, { useState, useTransition } from "react";
import { MapPin, Copy, Check, MessageCircle, MousePointerClick, Archive, ArchiveRestore } from "lucide-react";
import type { TrackedLink } from "@/lib/data/types";
import { useToast } from "@/components/Toast";
import { markSentAction, markArchivedAction } from "./actions";

type Town = {
  town: string;
  sections: { campaign: string; label: string }[];
  /** Only count/show links whose location matches this, when a campaign is shared across towns */
  location?: string;
};

const TOWNS: Town[] = [
  {
    town: "Vizag",
    sections: [
      { campaign: "vizag-restaurants", label: "Restaurants & cafes" },
      { campaign: "vizag-clinics", label: "Clinics & hospitals" },
      { campaign: "vizag-showrooms", label: "Furniture & interior showrooms" },
    ],
  },
  {
    town: "Vijayawada",
    location: "Vijayawada",
    sections: [
      { campaign: "ap-restaurants", label: "Restaurants & cafes" },
      { campaign: "ap-clinics", label: "Clinics & hospitals" },
      { campaign: "ap-showrooms", label: "Furniture & interior showrooms" },
    ],
  },
  {
    town: "Guntur",
    location: "Guntur",
    sections: [
      { campaign: "ap-restaurants", label: "Restaurants & cafes" },
      { campaign: "ap-clinics", label: "Clinics & hospitals" },
      { campaign: "ap-showrooms", label: "Furniture & interior showrooms" },
    ],
  },
];

function belongsToTown(link: TrackedLink, town: Town): boolean {
  const campaigns = new Set(town.sections.map((s) => s.campaign));
  if (!campaigns.has(link.campaign || "")) return false;
  if (town.location && link.location !== town.location) return false;
  return true;
}

const TIER_ORDER: Record<string, number> = { "Tier 1": 0, "Tier 2": 1, "Tier 3": 2 };
function tierRank(tier?: string): number {
  if (!tier) return 99;
  return TIER_ORDER[tier] ?? (tier.startsWith("Tier 3") ? 2.5 : 99);
}

function waLink(phone: string | undefined, message: string | undefined): string {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0+/, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${withCountry}?text=${text}`;
}

function Row({ link, archivedView = false }: { link: TrackedLink; archivedView?: boolean }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sent = !!link.sent_at;
  const archived = !!link.archived_at;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.message || "");
      setCopied(true);
      showToast("Message copied", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Could not copy, select the text manually", "error");
    }
  };

  const toggleSent = () => {
    startTransition(async () => {
      await markSentAction(link.id, !sent);
    });
  };

  const toggleArchived = () => {
    startTransition(async () => {
      await markArchivedAction(link.id, !archived);
    });
  };

  return (
    <div className={`border-2 border-[#16130f] bg-white p-4 space-y-3 ${sent && !archivedView ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-mono text-sm font-bold text-[#16130f]">{link.contact_name}</p>
            {link.tier && (
              <span
                className={`label px-1 py-0.5 border ${
                  link.tier === "Tier 1"
                    ? "bg-[#16130f] text-white border-[#16130f]"
                    : "bg-white text-[#7c7770] border-[#16130f]/30"
                }`}
              >
                {link.tier}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#7c7770] mt-0.5">
            {link.contact_phone || "no phone"}
            {link.location ? ` · ${link.location}` : ""}
            {link.click_count > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#c8102e]">
                <MousePointerClick className="w-3 h-3" /> clicked
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!archivedView && (
            <button
              type="button"
              onClick={toggleSent}
              disabled={isPending}
              className={`label px-2 py-1 border-2 ${
                sent
                  ? "bg-[#16130f] text-white border-[#16130f]"
                  : "bg-white text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
              }`}
            >
              {sent ? "Sent" : "Mark sent"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleArchived}
            disabled={isPending}
            title={archived ? "Unarchive" : "No WhatsApp, archive"}
            className="label px-2 py-1 border-2 border-[#16130f] bg-white text-[#16130f] hover:bg-[#ede8df] flex items-center gap-1"
          >
            {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {link.message && (
        <pre className="text-xs font-mono whitespace-pre-wrap bg-[#f6f3ee] border border-[#16130f]/15 p-3 leading-relaxed">
          {link.message}
        </pre>
      )}

      <div className="flex items-center gap-2">
        <a
          href={waLink(link.contact_phone, link.message)}
          target="_blank"
          rel="noreferrer"
          className="brutal-btn-red text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Open in WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="brutal-btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          Copy message
        </button>
      </div>
    </div>
  );
}

export function VizagPageClient({ links }: { links: TrackedLink[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const active = links.filter((l) => !l.archived_at);
  const archived = links.filter((l) => l.archived_at);
  const totalSent = active.filter((l) => l.sent_at).length;

  const townsWithData = TOWNS.filter((town) => active.some((l) => belongsToTown(l, town)));
  const [activeTown, setActiveTown] = useState<string>(townsWithData[0]?.town || TOWNS[0].town);
  const currentTown = townsWithData.find((t) => t.town === activeTown) || townsWithData[0];

  return (
    <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
      <div className="border-b-2 border-[#16130f] pb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#c8102e]" />
          <span className="label text-[#7c7770]">Local outreach</span>
        </div>
        <h1 className="font-display font-semibold italic text-3xl md:text-4xl tracking-tight text-[#16130f] mt-1.5">
          Local outreach
        </h1>
        <p className="font-sans text-xs text-[#7c7770] mt-2">
          Open each in WhatsApp, send, mark it sent. Clicked shows who actually opened the link. Archive a lead if they have no WhatsApp account, it drops out of this list without losing the work.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 border-2 border-[#16130f] bg-white px-3 py-1.5 shadow-[2px_2px_0px_#16130f]">
            <span className="label text-[#7c7770]">Sent</span>
            <span className="font-mono font-bold text-[#16130f]">{totalSent} / {active.length}</span>
          </div>
          {archived.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="label px-3 py-1.5 border-2 border-[#16130f] bg-white text-[#7c7770] hover:bg-[#ede8df] flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </button>
          )}
        </div>
      </div>

      {townsWithData.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b-2 border-[#16130f] pb-4">
          {townsWithData.map((town) => {
            const townActive = active.filter((l) => belongsToTown(l, town));
            const isActive = town.town === currentTown?.town;
            return (
              <button
                key={town.town}
                type="button"
                onClick={() => setActiveTown(town.town)}
                className={`label px-4 py-2 border-2 border-[#16130f] ${
                  isActive
                    ? "bg-[#16130f] text-white shadow-[2px_2px_0px_#16130f]"
                    : "bg-white text-[#16130f] hover:bg-[#ede8df]"
                }`}
              >
                {town.town} ({townActive.length})
              </button>
            );
          })}
        </div>
      )}

      {currentTown && (
        <div className="space-y-6">
          {townsWithData.length <= 1 && (
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#c8102e] border-b border-[#16130f]/20 pb-1">
              {currentTown.town}
            </h2>
          )}
          {currentTown.sections.map((section) => {
            const rows = active
              .filter((l) => belongsToTown(l, currentTown) && l.campaign === section.campaign)
              .sort((a, b) => {
                const t = tierRank(a.tier) - tierRank(b.tier);
                return t !== 0 ? t : (a.contact_name || "").localeCompare(b.contact_name || "");
              });
            const sentCount = rows.filter((l) => l.sent_at).length;
            if (rows.length === 0) return null;
            return (
              <div key={section.campaign} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#16130f]">
                    {section.label}
                  </h3>
                  <span className="label text-[#7c7770]">{sentCount} / {rows.length} sent</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rows.map((link) => (
                    <Row key={link.id} link={link} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showArchived && archived.length > 0 && (
        <div className="space-y-3 pt-4 border-t-2 border-[#16130f]">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#7c7770]">
            Archived ({archived.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {archived
              .sort((a, b) => (a.contact_name || "").localeCompare(b.contact_name || ""))
              .map((link) => (
                <Row key={link.id} link={link} archivedView />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
