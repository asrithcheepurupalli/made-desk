import React from "react";
import { Sparkles, Bot, ShieldCheck, Zap } from "lucide-react";
import { ChatWindow } from "./ChatWindow";
import { getDynamicSuggestionsAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Studio AI Assistant: made. desk",
};

export default async function AssistantPage() {
  const dynamicSuggestions = await getDynamicSuggestionsAction();

  return (
    <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c8102e]" />
            <span className="label text-[#7c7770]">Pillar 05 / Grounded Intelligence</span>
          </div>
          <h1 className="font-display font-semibold italic text-3xl md:text-4xl tracking-tight text-[#16130f] mt-1">
            Studio Assistant<span className="not-italic text-[#c8102e]">.</span>
          </h1>
          <p className="font-sans text-xs text-[#7c7770] mt-1">
            Grounded in our active playbooks, client onboarding records, reel captures, and next actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
            <Zap className="w-4 h-4 text-[#c8102e]" />
            <div>
              <p className="label text-[#7c7770]">Superpowers</p>
              <p className="font-mono font-bold text-xs text-[#16130f]">SOP & PDF Generator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface with Real Dynamic Suggestions */}
      <ChatWindow initialSuggestions={dynamicSuggestions} />
    </div>
  );
}
