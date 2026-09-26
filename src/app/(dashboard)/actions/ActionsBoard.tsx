"use client";

import React, { useState, useTransition } from "react";
import {
  CheckSquare,
  Square,
  Clock,
  Trash2,
  Plus,
  Filter,
  Sparkles,
  Layers,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  createActionHandler,
  toggleActionStatusHandler,
  updateActionPriorityHandler,
  deleteActionHandler,
} from "./actions";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import type { NextAction, ActionPriority, ActionStatus, Capture } from "@/lib/data/types";

interface ActionsBoardProps {
  initialActions: NextAction[];
  captures: Capture[];
}

export function ActionsBoard({ initialActions, captures }: ActionsBoardProps) {
  const [actions, setActions] = useState<NextAction[]>(initialActions);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<ActionPriority>("medium");
  const [isAdding, startAdding] = useTransition();
  const [isMutating, startMutating] = useTransition();

  // Keep local state in sync when server props revalidate
  React.useEffect(() => {
    setActions(initialActions);
  }, [initialActions]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startAdding(async () => {
      const formData = new FormData();
      formData.append("title", newTitle);
      if (newDesc) formData.append("description", newDesc);
      formData.append("priority", newPriority);

      await createActionHandler(formData);
      setNewTitle("");
      setNewDesc("");
    });
  };

  const handleToggleDone = (action: NextAction) => {
    const nextStatus: ActionStatus = action.status === "done" ? "todo" : "done";

    // Optimistic update
    setActions((prev) =>
      prev.map((a) => (a.id === action.id ? { ...a, status: nextStatus } : a))
    );

    startMutating(async () => {
      await toggleActionStatusHandler(action.id, nextStatus);
    });
  };

  const handleStatusChange = (id: string, newStatus: ActionStatus) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    startMutating(async () => {
      await toggleActionStatusHandler(id, newStatus);
    });
  };

  const handleDelete = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));

    startMutating(async () => {
      await deleteActionHandler(id);
    });
  };

  const filteredActions = actions.filter((act) => {
    if (filterStatus !== "all" && act.status !== filterStatus) return false;
    if (filterPriority !== "all" && act.priority !== filterPriority) return false;
    return true;
  });

  const captureMap = new Map(captures.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      {/* Quick Add Action Card */}
      <div className="brutal-card p-5 bg-white">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
            <span className="label text-[#16130f]">Quick Task Entry</span>
            <span className="label text-[#7c7770]">Operational Queue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done next? (e.g., Draft UAE outreach audit PDF template)"
              className="md:col-span-6 px-3 py-2 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#c8102e]"
              disabled={isAdding}
            />

            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Context or notes (optional)..."
              className="md:col-span-3 px-3 py-2 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-[#c8102e]"
              disabled={isAdding}
            />

            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as ActionPriority)}
              className="md:col-span-2 px-2 py-2 bg-[#f6f3ee] border-2 border-[#16130f] text-xs font-mono uppercase font-bold focus:outline-hidden focus:bg-white"
              disabled={isAdding}
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              type="submit"
              disabled={isAdding}
              className="md:col-span-1 brutal-btn-red text-xs py-2 flex items-center justify-center"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 border-2 border-[#16130f]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#7c7770]" />
          <span className="label text-[#16130f]">Filters:</span>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {["all", "todo", "in_progress", "done", "snoozed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`label px-2.5 py-1 border transition-all ${
                  filterStatus === st
                    ? "bg-[#16130f] text-white border-[#16130f]"
                    : "bg-[#f6f3ee] text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="label text-[#7c7770]">Priority:</span>
          {["all", "urgent", "high", "medium", "low"].map((pr) => (
            <button
              key={pr}
              onClick={() => setFilterPriority(pr)}
              className={`label px-2 py-1 border transition-all ${
                filterPriority === pr
                  ? "bg-[#c8102e] text-white border-[#16130f]"
                  : "bg-[#f6f3ee] text-[#16130f] border-[#16130f] hover:bg-[#ede8df]"
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {filteredActions.length === 0 ? (
          <div className="brutal-card p-10 bg-white text-center">
            <CheckSquare className="w-8 h-8 text-[#7c7770] mx-auto mb-2" />
            <h4 className="font-display font-bold text-base text-[#16130f]">
              No Actions Match Filter
            </h4>
            <p className="font-sans text-xs text-[#7c7770] mt-1">
              Add a new task above or capture ideas from reels in the Inbox.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => {
            const isDone = action.status === "done";
            const parentCapture = action.source_capture_id
              ? captureMap.get(action.source_capture_id)
              : null;

            return (
              <div
                key={action.id}
                className={`border-2 border-[#16130f] p-4 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDone
                    ? "bg-[#f6f3ee] opacity-75 shadow-none"
                    : "shadow-[3px_3px_0px_#16130f]"
                }`}
              >
                {/* Left checkbox & text */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleDone(action)}
                    className="mt-0.5 text-[#16130f] hover:text-[#c8102e] transition-colors"
                  >
                    {isDone ? (
                      <div className="w-5 h-5 bg-[#16130f] text-white flex items-center justify-center border border-[#16130f]">
                        ✓
                      </div>
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-sans text-sm font-bold ${
                          isDone
                            ? "line-through text-[#7c7770]"
                            : "text-[#16130f]"
                        }`}
                      >
                        {action.title}
                      </span>
                      <PriorityBadge priority={action.priority} />
                    </div>

                    {action.description && (
                      <p className="font-sans text-xs text-[#7c7770] leading-relaxed">
                        {action.description}
                      </p>
                    )}

                    {parentCapture && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-[#7c7770]">
                        <Sparkles className="w-3 h-3 text-[#c8102e]" />
                        <span>Derived from {parentCapture.source_type} capture:</span>
                        <span className="truncate max-w-xs font-semibold text-[#16130f]">
                          {parentCapture.summary?.slice(0, 45)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <select
                    value={action.status}
                    onChange={(e) =>
                      handleStatusChange(action.id, e.target.value as ActionStatus)
                    }
                    className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] text-[#16130f] focus:outline-hidden"
                  >
                    <option value="todo">TO DO</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="done">DONE</option>
                    <option value="snoozed">SNOOZED</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(action.id)}
                    className="p-1.5 text-[#7c7770] hover:text-[#c8102e] hover:bg-[#fbe8eb] border border-transparent hover:border-[#c8102e] transition-all"
                    title="Delete action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
