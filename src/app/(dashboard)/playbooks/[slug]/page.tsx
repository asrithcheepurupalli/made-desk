import React from "react";
import { notFound } from "next/navigation";
import { getPlaybookBySlug } from "@/lib/data/playbooks";
import { PlaybookEditorView } from "./PlaybookEditorView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const playbook = await getPlaybookBySlug(slug);

  if (!playbook) {
    return {
      title: "Playbook Not Found: made. desk",
    };
  }

  return {
    title: `${playbook.title}: Playbooks: made. desk`,
  };
}

export default async function PlaybookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const playbook = await getPlaybookBySlug(slug);

  if (!playbook) {
    notFound();
  }

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <PlaybookEditorView playbook={playbook} />
    </div>
  );
}
