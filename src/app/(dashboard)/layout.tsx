import React from "react";
import { requireStudioAccess } from "@/lib/studio-access";
import { DashboardShell } from "@/components/DashboardShell";

// Video download + transcription + extraction can take well over the default limit
export const maxDuration = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudioAccess();

  return <DashboardShell>{children}</DashboardShell>;
}
