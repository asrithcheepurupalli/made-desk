import React from "react";
import { PlaybookDetailClient } from "./PlaybookDetailClient";

export const metadata = {
  title: "Playbook: made. desk",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlaybookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <PlaybookDetailClient slug={slug} />;
}
