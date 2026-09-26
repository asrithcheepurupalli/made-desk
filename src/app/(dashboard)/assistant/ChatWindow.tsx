"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  Users,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Bot,
  User,
  ArrowRight,
} from "lucide-react";
import { askAssistantAction, type AssistantSource } from "./actions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedSources?: AssistantSource[];
  timestamp: string;
}

const STARTER_PROMPTS = [
  "How do we approach and greet UAE enterprise prospects?",
  "What assets must we collect before onboarding a client?",
  "Summarize our active next actions and open tasks.",
  "What is our standard follow-up timeline after a pitch?",
  "How should we structure monthly retainer deliverables?",
];

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to made. desk. We are grounded in all our studio playbooks, active client workspaces, reel transcripts, and next actions.\n\nAsk any question about our outreach SOPs, onboarding milestones, or client requirements.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await askAssistantAction(history, text);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.content,
        citedSources: res.citedSources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Conversation reset. How can we assist with our studio workflows, outreach protocols, or client milestones today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-[#faf8f5] border-2 border-[#16130f] shadow-[4px_4px_0px_#16130f]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b-2 border-[#16130f]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
          <span className="label text-[#16130f]">Operational Assistant · Grounded Gemini Model</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="label text-[#7c7770] hover:text-[#c8102e] flex items-center gap-1 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="label text-[#7c7770]">
                {msg.role === "user" ? "You (Founder / Team)" : "made. desk AI"}
              </span>
              <span className="text-[10px] font-mono text-[#7c7770]">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-2xl w-full p-4 border-2 border-[#16130f] ${
                msg.role === "user"
                  ? "bg-[#16130f] text-white shadow-[2px_2px_0px_#7c7770]"
                  : "bg-white text-[#16130f] shadow-[3px_3px_0px_#16130f]"
              }`}
            >
              {/* Message text with basic markdown formatting */}
              <div className="font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap space-y-2">
                {msg.content}
              </div>

              {/* Cited Sources section for Assistant messages */}
              {msg.citedSources && msg.citedSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#ede8df] space-y-1.5">
                  <span className="label text-[#7c7770] block">Referenced Studio Knowledge:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citedSources.map((source, idx) => (
                      <Link
                        key={idx}
                        href={source.url}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#c8102e] hover:text-white transition-colors"
                      >
                        {source.type === "playbook" && <BookOpen className="w-3 h-3" />}
                        {source.type === "client" && <Users className="w-3 h-3" />}
                        {source.type === "action" && <CheckCircle2 className="w-3 h-3" />}
                        <span>{source.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {msg.role === "assistant" && (
                <div className="flex justify-end mt-3 pt-2 border-t border-[#f6f3ee]">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="label text-[#7c7770] hover:text-[#16130f] flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-[#25d366]" />
                        <span className="text-[#25d366]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="label text-[#7c7770]">made. desk AI</span>
              <span className="text-[10px] font-mono text-[#7c7770]">Grounding query...</span>
            </div>
            <div className="bg-white border-2 border-[#16130f] p-4 shadow-[3px_3px_0px_#16130f] flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[#c8102e] border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-xs text-[#16130f]">
                Searching playbooks, clients, and captures...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompt Chips (only if few messages) */}
      {messages.length <= 2 && !isPending && (
        <div className="px-4 py-2 bg-white border-t border-[#ede8df] overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="label text-[#7c7770]">Suggestions:</span>
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] font-mono bg-[#f6f3ee] hover:bg-[#16130f] hover:text-white border border-[#16130f] px-2.5 py-1 transition-colors flex items-center gap-1"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t-2 border-[#16130f]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about agency SOPs, outreach tactics, onboarding checklists, client status..."
            rows={2}
            className="flex-1 p-2.5 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white resize-none"
          />

          <button
            type="button"
            disabled={!input.trim() || isPending}
            onClick={() => handleSend()}
            className="brutal-btn-red py-3 px-4 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Assistant</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] font-mono text-[#7c7770]">
            Press Enter to submit · Shift+Enter for new line
          </span>
          <span className="text-[10px] font-mono text-[#7c7770]">
            Strictly grounded in studio records
          </span>
        </div>
      </div>
    </div>
  );
}
