"use client";

import React from "react";
import { getClientBySlug } from "@/lib/data/clients";
import { listNextActions } from "@/lib/data/actions";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading, NotFoundInStore } from "@/components/PageLoading";
import { ClientWorkspaceView } from "./ClientWorkspaceView";

export function ClientDetailClient({ slug }: { slug: string }) {
  const state = useStoreQuery(async () => {
    const client = await getClientBySlug(slug);
    const actions = client ? await listNextActions() : [];
    return { client, actions };
  });

  if (!state) return <PageLoading />;
  if (!state.client) {
    return <NotFoundInStore what="client workspace" href="/clients" label="Back to clients" />;
  }

  const client = state.client;
  const linkedActions = state.actions.filter((a) => a.linked_client_id === client.id);

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <ClientWorkspaceView key={client.id} client={client} linkedActions={linkedActions} />
    </div>
  );
}
