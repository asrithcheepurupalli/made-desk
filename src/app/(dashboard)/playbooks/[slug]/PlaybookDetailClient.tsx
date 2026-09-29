"use client";

import React from "react";
import { getPlaybookBySlug } from "@/lib/data/playbooks";
import { useStoreQuery } from "@/lib/store/useStore";
import { PageLoading, NotFoundInStore } from "@/components/PageLoading";
import { PlaybookEditorView } from "./PlaybookEditorView";

export function PlaybookDetailClient({ slug }: { slug: string }) {
  const state = useStoreQuery(async () => ({ playbook: await getPlaybookBySlug(slug) }));

  if (!state) return <PageLoading />;
  if (!state.playbook) {
    return <NotFoundInStore what="playbook" href="/playbooks" label="Back to playbooks" />;
  }

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <PlaybookEditorView key={state.playbook.id} playbook={state.playbook} />
    </div>
  );
}
