"use server";

import { revalidatePath } from "next/cache";
import {
  createNextAction,
  updateNextAction,
  deleteNextAction,
} from "@/lib/data/actions";
import type { ActionPriority, ActionStatus } from "@/lib/data/types";

export async function createActionHandler(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const priority = (formData.get("priority") as ActionPriority) || "medium";

  if (!title || title.trim().length === 0) {
    return { error: "Action title is required." };
  }

  try {
    const action = await createNextAction({
      title: title.trim(),
      description: description?.trim(),
      priority,
      status: "todo",
    });

    revalidatePath("/actions");
    revalidatePath("/inbox");
    return { success: true, actionId: action.id };
  } catch (error) {
    console.error("Error creating action:", error);
    return { error: "Failed to create action." };
  }
}

export async function toggleActionStatusHandler(id: string, newStatus: ActionStatus) {
  try {
    await updateNextAction(id, { status: newStatus });
    revalidatePath("/actions");
    revalidatePath("/inbox");
    return { success: true };
  } catch (error) {
    console.error("Error updating action status:", error);
    return { error: "Failed to update action status." };
  }
}

export async function updateActionPriorityHandler(id: string, priority: ActionPriority) {
  try {
    await updateNextAction(id, { priority });
    revalidatePath("/actions");
    return { success: true };
  } catch (error) {
    console.error("Error updating action priority:", error);
    return { error: "Failed to update priority." };
  }
}

export async function deleteActionHandler(id: string) {
  try {
    await deleteNextAction(id);
    revalidatePath("/actions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting action:", error);
    return { error: "Failed to delete action." };
  }
}
