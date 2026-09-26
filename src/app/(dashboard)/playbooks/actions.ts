"use server";

import { revalidatePath } from "next/cache";
import {
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  getPlaybookBySlug,
} from "@/lib/data/playbooks";
import type { PlaybookCategory, Region } from "@/lib/data/types";

export async function createPlaybookAction(formData: FormData) {
  const title = formData.get("title") as string;
  const category = (formData.get("category") as PlaybookCategory) || "acquisition";
  const region = (formData.get("region") as Region) || "global";
  const summary = (formData.get("summary") as string) || undefined;

  if (!title || title.trim().length === 0) {
    return { error: "Playbook title is required." };
  }

  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  try {
    const playbook = await createPlaybook({
      slug,
      title: title.trim(),
      category,
      region,
      tags: ["sop", category],
      summary: summary?.trim() || "Operational standard procedure for made. by ac.",
      content: [
        {
          id: "b1",
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text", text: title.trim() }],
        },
        {
          id: "b2",
          type: "paragraph",
          content: [{ type: "text", text: summary?.trim() || "Add procedure details below..." }],
        },
        {
          id: "b3",
          type: "heading",
          props: { level: 2 },
          content: [{ type: "text", text: "Step-by-Step Procedure" }],
        },
        {
          id: "b4",
          type: "bulletListItem",
          content: [{ type: "text", text: "Step 1: Define specific client context and preparation." }],
        },
      ],
    });

    revalidatePath("/playbooks");
    return { success: true, slug: playbook.slug };
  } catch (error) {
    console.error("Error creating playbook:", error);
    return { error: "Failed to create playbook." };
  }
}

export async function updatePlaybookContentAction(
  slug: string,
  content: any[],
  meta?: { title?: string; summary?: string; category?: PlaybookCategory; region?: Region; tags?: string[] }
) {
  try {
    const updated = await updatePlaybook(slug, {
      content,
      ...(meta?.title ? { title: meta.title } : {}),
      ...(meta?.summary ? { summary: meta.summary } : {}),
      ...(meta?.category ? { category: meta.category } : {}),
      ...(meta?.region ? { region: meta.region } : {}),
      ...(meta?.tags ? { tags: meta.tags } : {}),
    });

    revalidatePath(`/playbooks/${slug}`);
    revalidatePath("/playbooks");
    return { success: true, playbook: updated };
  } catch (error) {
    console.error("Error updating playbook content:", error);
    return { error: "Failed to save playbook content." };
  }
}

export async function deletePlaybookAction(slug: string) {
  try {
    await deletePlaybook(slug);
    revalidatePath("/playbooks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting playbook:", error);
    return { error: "Failed to delete playbook." };
  }
}
