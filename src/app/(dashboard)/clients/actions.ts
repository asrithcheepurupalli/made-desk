import {
  createClient,
  updateClient,
  deleteClient,
  getClientBySlug,
  getClientById,
} from "@/lib/data/clients";
import type { ClientStage, Region, ContactInfo, OnboardingChecklistItem } from "@/lib/data/types";

export async function createClientAction(formData: FormData) {
  const name = formData.get("name") as string;
  const company = (formData.get("company") as string) || undefined;
  const stage = (formData.get("stage") as ClientStage) || "lead";
  const region = (formData.get("region") as Region) || "global";
  const email = (formData.get("email") as string) || undefined;
  const phone = (formData.get("phone") as string) || undefined;
  const whatsapp = (formData.get("whatsapp") as string) || undefined;
  const role = (formData.get("role") as string) || undefined;
  const website = (formData.get("website") as string) || undefined;

  if (!name || name.trim().length === 0) {
    return { error: "Client contact name is required." };
  }

  const baseIdentifier = company || name;
  const baseSlug = baseIdentifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const defaultChecklist: OnboardingChecklistItem[] = [
    {
      id: "chk-1",
      task: "Send agency portfolio & capability deck",
      completed: false,
    },
    {
      id: "chk-2",
      task: "Collect brand assets, fonts, and Figma access",
      completed: false,
    },
    {
      id: "chk-3",
      task: "Countersign master services agreement & NDA",
      completed: false,
    },
    {
      id: "chk-4",
      task: "Set up dedicated WhatsApp or Slack communication group",
      completed: false,
    },
    {
      id: "chk-5",
      task: "Send retainer invoice #1 and confirm payment",
      completed: false,
    },
  ];

  try {
    const client = await createClient({
      slug,
      name: name.trim(),
      company: company?.trim(),
      stage,
      region,
      contact_info: {
        email: email?.trim(),
        phone: phone?.trim(),
        whatsapp: whatsapp?.trim() || phone?.trim(),
        role: role?.trim(),
        website: website?.trim(),
      },
      onboarding_checklist: defaultChecklist,
      content: [
        {
          id: "b1",
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text", text: `${company || name}: Client Workspace` }],
        },
        {
          id: "b2",
          type: "callout",
          content: [
            {
              type: "text",
              text: `Active project space for ${company || name} (${region.toUpperCase()}). Maintain meeting briefs, design links, and deliverable logs here.`,
            },
          ],
        },
        {
          id: "b3",
          type: "heading",
          props: { level: 2 },
          content: [{ type: "text", text: "Scope & Deliverables" }],
        },
        {
          id: "b4",
          type: "bulletListItem",
          content: [{ type: "text", text: "Deliverable 1: Core Design Kit & Figma System" }],
        },
      ],
      tags: [stage, region],
    });

    return { success: true, slug: client.slug };
  } catch (error) {
    console.error("Error creating client:", error);
    return { error: "Failed to create client workspace." };
  }
}

export async function updateClientStageAction(id: string, stage: ClientStage) {
  try {
    await updateClient(id, { stage });
    return { success: true };
  } catch (error) {
    console.error("Error updating client stage:", error);
    return { error: "Failed to update client stage." };
  }
}

export async function toggleClientChecklistItemAction(
  clientId: string,
  taskId: string,
  completed: boolean
) {
  try {
    const client = await getClientById(clientId);
    if (!client) return { error: "Client not found." };

    const updatedChecklist = client.onboarding_checklist.map((item) =>
      item.id === taskId
        ? {
            ...item,
            completed,
            sent_at: completed ? new Date().toISOString() : undefined,
          }
        : item
    );

    await updateClient(clientId, { onboarding_checklist: updatedChecklist });
    return { success: true };
  } catch (error) {
    console.error("Error toggling checklist item:", error);
    return { error: "Failed to update checklist item." };
  }
}

export async function addClientChecklistItemAction(
  clientId: string,
  task: string
) {
  try {
    const client = await getClientById(clientId);
    if (!client) return { error: "Client not found." };

    const newItem: OnboardingChecklistItem = {
      id: `chk-${Date.now()}`,
      task: task.trim(),
      completed: false,
    };

    const updatedChecklist = [...client.onboarding_checklist, newItem];
    await updateClient(clientId, { onboarding_checklist: updatedChecklist });
    return { success: true };
  } catch (error) {
    console.error("Error adding checklist item:", error);
    return { error: "Failed to add checklist item." };
  }
}

export async function deleteClientChecklistItemAction(
  clientId: string,
  taskId: string
) {
  try {
    const client = await getClientById(clientId);
    if (!client) return { error: "Client not found." };

    const updatedChecklist = client.onboarding_checklist.filter((i) => i.id !== taskId);
    await updateClient(clientId, { onboarding_checklist: updatedChecklist });
    return { success: true };
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return { error: "Failed to delete checklist item." };
  }
}

export async function updateClientWorkspaceAction(
  slug: string,
  content: any[],
  meta?: { name?: string; company?: string; stage?: ClientStage; region?: Region; contact_info?: ContactInfo; tags?: string[] }
) {
  try {
    const client = await getClientBySlug(slug);
    if (!client) return { error: "Client not found." };

    const updated = await updateClient(client.id, {
      content,
      ...(meta?.name ? { name: meta.name } : {}),
      ...(meta?.company ? { company: meta.company } : {}),
      ...(meta?.stage ? { stage: meta.stage } : {}),
      ...(meta?.region ? { region: meta.region } : {}),
      ...(meta?.contact_info ? { contact_info: meta.contact_info } : {}),
      ...(meta?.tags ? { tags: meta.tags } : {}),
    });

    return { success: true, client: updated };
  } catch (error) {
    console.error("Error updating client workspace:", error);
    return { error: "Failed to save client workspace." };
  }
}

export async function deleteClientAction(id: string) {
  try {
    await deleteClient(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { error: "Failed to delete client." };
  }
}
