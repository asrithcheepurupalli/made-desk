"use client";

import dynamic from "next/dynamic";

// Everything on the board comes from a folder on this Mac and from the clock, so there is
// nothing for the server to render. Loading it in the browser only keeps the two in step.
const OutreachBoard = dynamic(() => import("./OutreachBoard").then((m) => m.OutreachBoard), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#f6f3ee] p-8 font-mono text-xs text-[#7c7770]">Opening the outreach board…</div>,
});

export function BoardLoader({ initialSample }: { initialSample: boolean }) {
  return <OutreachBoard initialSample={initialSample} />;
}
