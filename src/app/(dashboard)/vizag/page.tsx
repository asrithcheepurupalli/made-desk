import React from "react";
import { VizagPageClient } from "./VizagPageClient";
import { listTrackedLinks } from "@/lib/data/trackedLinks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vizag outreach: made. desk",
};

export default async function Page() {
  const links = await listTrackedLinks({ includeArchived: true });
  const vizagLinks = links.filter((l) => (l.campaign || "").startsWith("vizag-"));
  return <VizagPageClient links={vizagLinks} />;
}
