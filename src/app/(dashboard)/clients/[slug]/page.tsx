import React from "react";
import { notFound } from "next/navigation";
import { getClientBySlug } from "@/lib/data/clients";
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
      title: "Client Workspace Not Found: made. desk",
    };
  }

  return {
    title: `${client.company || client.name}: Client Workspace: made. desk`,
  };
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    notFound();
  }

  // Fetch actions linked to this client
  const allActions = await listNextActions();
  const linkedActions = allActions.filter((a) => a.linked_client_id === client.id);

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <ClientWorkspaceView client={client} linkedActions={linkedActions} />
    </div>
  );
}
