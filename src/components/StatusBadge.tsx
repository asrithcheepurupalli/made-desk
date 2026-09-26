import React from "react";
import type { ActionPriority, ActionStatus, ClientStage, Region, PlaybookCategory } from "@/lib/data/types";

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const styles: Record<ActionPriority, string> = {
    urgent: "bg-[#c8102e] text-white border-[#16130f]",
    high: "bg-[#fbe8eb] text-[#c8102e] border-[#c8102e]",
    medium: "bg-[#f6f3ee] text-[#16130f] border-[#16130f]",
    low: "bg-[#ede8df] text-[#7c7770] border-[#7c7770]",
  };

  return (
    <span
      className={`label inline-flex items-center px-2 py-0.5 border ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: ActionStatus }) {
  const styles: Record<ActionStatus, string> = {
    todo: "bg-white text-[#16130f] border-[#16130f]",
    in_progress: "bg-[#bd9b4e] text-white border-[#16130f]",
    done: "bg-[#16130f] text-[#f6f3ee] border-[#16130f]",
    snoozed: "bg-[#ede8df] text-[#7c7770] border-[#7c7770]",
  };

  const labels: Record<ActionStatus, string> = {
    todo: "TO DO",
    in_progress: "IN PROGRESS",
    done: "DONE",
    snoozed: "SNOOZED",
  };

  return (
    <span
      className={`label inline-flex items-center px-2 py-0.5 border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: ClientStage }) {
  const styles: Record<ClientStage, string> = {
    lead: "bg-white text-[#16130f] border-[#16130f]",
    proposal: "bg-[#ede8df] text-[#16130f] border-[#16130f]",
    onboarding: "bg-[#c8102e] text-white border-[#16130f]",
    active: "bg-[#16130f] text-[#f6f3ee] border-[#16130f]",
    retained: "bg-[#bd9b4e] text-white border-[#16130f]",
    archived: "bg-[#e2dbce] text-[#7c7770] border-[#7c7770]",
  };

  return (
    <span
      className={`label inline-flex items-center px-2 py-0.5 border ${styles[stage]}`}
    >
      {stage}
    </span>
  );
}

export function RegionBadge({ region }: { region: Region }) {
  return (
    <span className="label inline-flex items-center px-2 py-0.5 border border-[#16130f] bg-[#ede8df] text-[#16130f]">
      {region}
    </span>
  );
}

export function CategoryBadge({ category }: { category: PlaybookCategory | string }) {
  return (
    <span className="label inline-flex items-center px-2 py-0.5 border border-[#16130f] bg-white text-[#16130f]">
      {category}
    </span>
  );
}
