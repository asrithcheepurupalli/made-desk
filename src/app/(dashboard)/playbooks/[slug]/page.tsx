import React from "react";
import { getPlaybookBySlug, createPlaybook } from "@/lib/data/playbooks";
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
      title: "Playbook Workspace: made. desk",
    };
  }

  return {
    title: `${playbook.title}: Playbooks: made. desk`,
  };
}

export default async function PlaybookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  let playbook = await getPlaybookBySlug(slug);

  if (!playbook) {
    const cleanTitle = decodeURIComponent(slug)
      .replace(/-[0-9]{4}$/, "")
      .replace(/-/g, " ");

    const formattedTitle =
      cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    playbook = await createPlaybook({
      slug,
      title: formattedTitle || "Operational SOP",
      category: "operations",
      region: "global",
      summary: `Standard operational playbook for ${formattedTitle}.`,
      tags: [],
      content: [
        {
          id: `b-head-${Date.now()}`,
          type: "heading_1",
          text: formattedTitle || "Operational SOP",
        },
        {
          id: `b-desc-${Date.now()}`,
          type: "paragraph",
          text: "Document operating steps, outreach templates, and guidelines below.",
        },
      ],
    });
  }

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <PlaybookEditorView playbook={playbook} />
    </div>
  );
}
