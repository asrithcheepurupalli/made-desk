"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { MASTERS_STATUS_EVENT, type MastersStatus } from "@/lib/masters/sync";

/** Live progress of the background merge. Renders nothing until a sync has happened this session. */
export function MastersStatusLine() {
  const [status, setStatus] = useState<MastersStatus | null>(null);
  useEffect(() => {
    const on = (e: Event) => setStatus((e as CustomEvent<MastersStatus>).detail);
    window.addEventListener(MASTERS_STATUS_EVENT, on);
    return () => window.removeEventListener(MASTERS_STATUS_EVENT, on);
  }, []);
  if (!status) return null;
  const Icon = status.running ? Loader2 : status.error ? AlertTriangle : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${status.error ? "text-[#c8102e]" : "text-[#7c7770]"}`}>
      <Icon className={`w-3.5 h-3.5 ${status.running ? "animate-spin" : ""}`} />
      {status.message}
    </span>
  );
}
