import React from "react";
import { LinksPageClient } from "./LinksPageClient";
import { listTrackedLinks } from "@/lib/data/trackedLinks";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tracked Links & Click Analytics: made. desk",
};

export default async function Page() {
  const links = await listTrackedLinks();
  return <LinksPageClient initialLinks={links} />;
}
