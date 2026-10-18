"use server";

import { markSent } from "@/lib/data/trackedLinks";
import { revalidatePath } from "next/cache";

export async function markSentAction(id: string, sent: boolean) {
  await markSent(id, sent);
  revalidatePath("/vizag");
}
