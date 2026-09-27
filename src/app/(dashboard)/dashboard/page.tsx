import React from "react";
import { listPlaybooks } from "@/lib/data/playbooks";
import { listClients } from "@/lib/data/clients";
import { listNextActions } from "@/lib/data/actions";
import { listCaptures } from "@/lib/data/captures";
import { DashboardOverview } from "./DashboardOverview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mission Control: made. desk",
};

export default async function DashboardPage() {
  const [playbooks, clients, actions, captures] = await Promise.all([
    listPlaybooks(),
    listClients(),
    listNextActions(),
    listCaptures(),
  ]);

  return (
    <DashboardOverview
      playbooks={playbooks}
      clients={clients}
      actions={actions}
      captures={captures}
    />
  );
}
