import React from "react";
import { listClients } from "@/lib/data/clients";
import { ClientsPipeline } from "./ClientsPipeline";
import { Users, Briefcase, CheckCircle2, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Client Workspace & Pipeline: made. desk",
};

export default async function ClientsPage() {
  const clients = await listClients();

  const activeCount = clients.filter((c) => c.stage === "active" || c.stage === "retained").length;
  const onboardingCount = clients.filter((c) => c.stage === "onboarding").length;
  const proposalCount = clients.filter((c) => c.stage === "proposal" || c.stage === "lead").length;

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Top Header & Metrics */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c8102e]" />
              <span className="label text-[#7c7770]">Pillar 03 / Client Management</span>
            </div>
            <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">
              Client Workspace & Pipeline
            </h1>
            <p className="font-sans text-xs text-[#7c7770] mt-1">
              Stage tracking, interactive onboarding checklists, and dedicated Notion-style client workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Active / Retained</p>
              <p className="font-mono font-bold text-xl text-[#c8102e]">{activeCount}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">In Onboarding</p>
              <p className="font-mono font-bold text-xl text-[#bd9b4e]">{onboardingCount}</p>
            </div>
            <div className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">Leads & Proposals</p>
              <p className="font-mono font-bold text-xl text-[#16130f]">{proposalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pipeline Component */}
      <ClientsPipeline initialClients={clients} />
    </div>
  );
}
