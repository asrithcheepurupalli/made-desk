"use server";

import { markSent, markArchived } from "@/lib/data/trackedLinks";
import { revalidatePath } from "next/cache";

export async function markSentAction(id: string, sent: boolean) {
  await markSent(id, sent);
  revalidatePath("/vizag");
}

export async function markArchivedAction(id: string, archived: boolean) {
  await markArchived(id, archived);
  revalidatePath("/vizag");
}
