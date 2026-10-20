import React from "react";
import { VizagPageClient } from "./VizagPageClient";
import { listTrackedLinks } from "@/lib/data/trackedLinks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Local outreach: made. desk",
};

export default async function Page() {
  const links = await listTrackedLinks({ includeArchived: true });
  const localOutreachLinks = links.filter((l) => {
    const campaign = l.campaign || "";
    return campaign.startsWith("vizag-") || campaign.startsWith("ap-");
  });
  return <VizagPageClient links={localOutreachLinks} />;
}
