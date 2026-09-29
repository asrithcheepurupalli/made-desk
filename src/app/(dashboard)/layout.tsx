import React from "react";
import { requireStudioAccess } from "@/lib/studio-access";
import { isEphemeralStorage } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudioAccess();

  return <DashboardShell ephemeral={isEphemeralStorage()}>{children}</DashboardShell>;
}
