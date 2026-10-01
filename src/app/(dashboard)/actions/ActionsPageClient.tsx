"use client";

import React from "react";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading } from "@/components/PageLoading";
import { listNextActions } from "@/lib/data/actions";
import { listCaptures } from "@/lib/data/captures";
import { ActionsBoard } from "./ActionsBoard";
import { TaskCleanup } from "./TaskCleanup";
import { CheckSquare, AlertCircle, CheckCircle2, Clock } from "lucide-react";



export function ActionsPageClient() {
  const data = useStoreQuery(async () => {
    const [actions, captures] = await Promise.all([listNextActions(), listCaptures()]);
    return { actions, captures };
  });
  if (!data) return <PageLoading />;
  const { actions, captures } = data;

  const todoCount = actions.filter((a) => a.status === "todo").length;
  const inProgressCount = actions.filter((a) => a.status === "in_progress").length;
  const doneCount = actions.filter((a) => a.status === "done").length;
  const urgentHighCount = actions.filter(
    (a) => (a.priority === "urgent" || a.priority === "high") && a.status !== "done"
  ).length;

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Top Header & Priority Metrics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#c8102e]" />
              <span className="label text-[#7c7770]">Pillar 04 / Execution Stream</span>
            </div>
            <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">
              Next Actions
            </h1>
            <p className="font-sans text-xs text-[#7c7770] mt-1">
              Prioritized tactical tasks auto-derived from reel captures and manual operational to-dos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#c8102e]" />
                <p className="label text-[#7c7770]">Urgent / High</p>
              </div>
              <p className="font-mono font-bold text-xl text-[#c8102e]">{urgentHighCount}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#bd9b4e]" />
                <p className="label text-[#7c7770]">In Progress</p>
              </div>
              <p className="font-mono font-bold text-xl text-[#16130f]">{inProgressCount}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16130f]" />
                <p className="label text-[#7c7770]">Completed</p>
              </div>
              <p className="font-mono font-bold text-xl text-[#16130f]">{doneCount}</p>
            </div>
          </div>
        </div>
      </div>

      <TaskCleanup openCount={actions.filter((a) => a.status !== "done").length} />

      {/* Main Board */}
      <ActionsBoard initialActions={actions} captures={captures} />
    </div>
  );
}
