"use client";

import React, { useState, useTransition } from "react";
import { MapPin, Copy, Check, MessageCircle, MousePointerClick } from "lucide-react";
import type { TrackedLink } from "@/lib/data/types";
import { useToast } from "@/components/Toast";
import { markSentAction } from "./actions";

const SECTIONS: { campaign: string; label: string }[] = [
  { campaign: "vizag-restaurants", label: "Restaurants & cafes" },
  { campaign: "vizag-clinics", label: "Clinics & hospitals" },
  { campaign: "vizag-showrooms", label: "Furniture & interior showrooms" },
];

function waLink(phone: string | undefined, message: string | undefined): string {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0+/, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${withCountry}?text=${text}`;
}

function Row({ link }: { link: TrackedLink }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sent = !!link.sent_at;

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

  return (
    <div className={`border-2 border-[#16130f] bg-white p-4 space-y-3 ${sent ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold text-[#16130f]">{link.contact_name}</p>
          <p className="text-[10px] font-mono text-[#7c7770] mt-0.5">
            {link.contact_phone || "no phone"}
            {link.click_count > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#c8102e]">
                <MousePointerClick className="w-3 h-3" /> clicked
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSent}
          disabled={isPending}
          className={`label px-2 py-1 border-2 shrink-0 ${
            sent
              ? "bg-[#16130f] text-white border-[#16130f]"
              : "bg-white text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
          }`}
        >
          {sent ? "Sent" : "Mark sent"}
        </button>
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
  const totalSent = links.filter((l) => l.sent_at).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
      <div className="border-b-2 border-[#16130f] pb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#c8102e]" />
          <span className="label text-[#7c7770]">Local outreach / Vizag</span>
        </div>
        <h1 className="font-display font-semibold italic text-3xl md:text-4xl tracking-tight text-[#16130f] mt-1.5">
          Vizag outreach
        </h1>
        <p className="font-sans text-xs text-[#7c7770] mt-2">
          99 restaurants, clinics and showrooms. Open each in WhatsApp, send, mark it sent. Clicked shows who actually opened the link.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 border-2 border-[#16130f] bg-white px-3 py-1.5 shadow-[2px_2px_0px_#16130f]">
          <span className="label text-[#7c7770]">Sent</span>
          <span className="font-mono font-bold text-[#16130f]">{totalSent} / {links.length}</span>
        </div>
      </div>

      {SECTIONS.map((section) => {
        const rows = links
          .filter((l) => l.campaign === section.campaign)
          .sort((a, b) => (a.contact_name || "").localeCompare(b.contact_name || ""));
        const sentCount = rows.filter((l) => l.sent_at).length;
        if (rows.length === 0) return null;
        return (
          <div key={section.campaign} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#16130f]">
                {section.label}
              </h2>
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
  );
}
