"use client";

import React, { useEffect, useState } from "react";
import { getLinkState, linkFolder, reconnect, startAutoSync, unlink, type LinkState } from "@/lib/store/diskSync";

function ago(ts?: number) {
  if (!ts) return "not yet";
  const s = Math.round((Date.now() - ts) / 1000);
  return s < 10 ? "just now" : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`;
}

export function ClaudeLink() {
  const [state, setState] = useState<LinkState | null>(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const stop = startAutoSync(setState);
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => {
      stop();
      clearInterval(t);
    };
  }, []);

  const run = async (fn: () => Promise<LinkState>) => {
    setBusy(true);
    try {
      setState(await fn());
    } catch (err) {
      // User cancelled the picker or denied access
      setState({ ...(await getLinkState()), error: err instanceof Error && err.name !== "AbortError" ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  const btn =
    "w-full border-2 border-[#16130f] bg-white px-2 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-[#ede8df] transition-colors disabled:opacity-50";

  if (!state.supported) {
    return <p className="text-[10px] font-mono text-[#7c7770] leading-snug">Claude link needs Chrome, Edge, Arc, or Brave.</p>;
  }
  if (!state.linked) {
    return (
      <div className="space-y-1">
        <button type="button" disabled={busy} onClick={() => run(linkFolder)} className={btn}>
          Link Claude
        </button>
        <p className="text-[10px] font-mono text-[#7c7770] leading-snug">Pick the made-desk/.data folder so Claude can read every SOP.</p>
        {state.error && <p className="text-[10px] font-mono text-[#c8102e]">{state.error}</p>}
      </div>
    );
  }
  if (state.permission !== "granted") {
    return (
      <div className="space-y-1">
        <button type="button" disabled={busy} onClick={() => run(reconnect)} className={`${btn} !bg-[#c8102e] !text-white`}>
          Reconnect Claude
        </button>
        <p className="text-[10px] font-mono text-[#7c7770] leading-snug">The browser needs one click to allow writing again.</p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
        <span>Claude</span>
        <span className="label text-[#16130f] bg-[#ede8df] px-1.5 py-0.5 border border-[#16130f]">Linked</span>
      </div>
      <p className="text-[10px] font-mono text-[#7c7770] leading-snug">
        Synced {ago(state.lastSync)} to /{state.folder}
        {state.error ? <span className="text-[#c8102e]"> ({state.error})</span> : null}
      </p>
      <button type="button" onClick={() => run(unlink)} className="text-[10px] font-mono underline text-[#7c7770]">
        Unlink
      </button>
    </div>
  );
}
