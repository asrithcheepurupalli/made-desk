import React from "react";
import { ClientDetailClient } from "./ClientDetailClient";

export const metadata = {
  title: "Client Workspace: made. desk",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ClientDetailClient slug={slug} />;
}
