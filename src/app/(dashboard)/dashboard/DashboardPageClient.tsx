"use client";

import React from "react";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading } from "@/components/PageLoading";
import { listPlaybooks } from "@/lib/data/playbooks";
import { listClients } from "@/lib/data/clients";
import { listNextActions } from "@/lib/data/actions";
import { listCaptures } from "@/lib/data/captures";
import { DashboardOverview } from "./DashboardOverview";



export function DashboardPageClient() {
  const data = useStoreQuery(async () => {
    const [playbooks, clients, actions, captures] = await Promise.all([
      listPlaybooks(),
      listClients(),
      listNextActions(),
      listCaptures(),
    ]);
    return { playbooks, clients, actions, captures };
  });
  if (!data) return <PageLoading />;
  const { playbooks, clients, actions, captures } = data;

  return (
    <DashboardOverview
      playbooks={playbooks}
      clients={clients}
      actions={actions}
      captures={captures}
    />
  );
}
