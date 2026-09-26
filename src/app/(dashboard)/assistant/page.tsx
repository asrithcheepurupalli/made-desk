import React from "react";
import { Sparkles, Bot, ShieldCheck } from "lucide-react";
import { ChatWindow } from "./ChatWindow";

export const metadata = {
  title: "Studio AI Assistant: made. desk",
};

export default function AssistantPage() {
  return (
    <div className="p-8 max-w-5xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c8102e]" />
            <span className="label text-[#7c7770]">Pillar 05 / Operational Intelligence</span>
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">
            Studio AI Assistant
          </h1>
          <p className="font-sans text-xs text-[#7c7770] mt-1">
            Grounded in our active playbooks, client onboarding records, reel extracts, and next actions.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
          <ShieldCheck className="w-4 h-4 text-[#25d366]" />
          <div>
            <p className="label text-[#7c7770]">Grounding Mode</p>
            <p className="font-mono font-bold text-xs text-[#16130f]">Zero-Hallucination SOP</p>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <ChatWindow />
    </div>
  );
}
