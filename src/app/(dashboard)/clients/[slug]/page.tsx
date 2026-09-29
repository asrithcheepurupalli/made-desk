import React from "react";
import { getClientBySlug, createClient } from "@/lib/data/clients";
import { listNextActions } from "@/lib/data/actions";
import { ClientWorkspaceView } from "./ClientWorkspaceView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    return {
      title: "Client Workspace: made. desk",
    };
  }

  return {
    title: `${client.company || client.name}: Client Workspace: made. desk`,
  };
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let client = await getClientBySlug(slug);

  if (!client) {
    const cleanName = decodeURIComponent(slug)
      .replace(/-[0-9]{4}$/, "")
      .replace(/-/g, " ");

    const formattedName =
      cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    client = await createClient({
      slug,
      name: formattedName || "New Client",
      company: formattedName || "New Client",
      stage: "lead",
      region: "global",
      contact_info: {},
      onboarding_checklist: [],
      content: [],
      tags: [],
    });
  }

  // Fetch actions linked to this client
  const allActions = await listNextActions();
  const linkedActions = allActions.filter((a) => a.linked_client_id === client?.id);

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <ClientWorkspaceView client={client} linkedActions={linkedActions} />
    </div>
  );
}
