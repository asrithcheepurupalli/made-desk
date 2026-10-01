import React from "react";
import { requireStudioAccess } from "@/lib/studio-access";
import { ToastProvider } from "@/components/Toast";

// The Outreach board is its own full-screen dashboard, outside the desk shell and its sidebar.
export default async function OutreachLayout({ children }: { children: React.ReactNode }) {
  await requireStudioAccess();
  return <ToastProvider>{children}</ToastProvider>;
}
