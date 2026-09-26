"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Building2,
  Layers,
  ChevronRight,
} from "lucide-react";
import { StageBadge, RegionBadge } from "@/components/StatusBadge";
import type { Client, ClientStage, Region } from "@/lib/data/types";
import { createClientAction, updateClientStageAction } from "./actions";

interface ClientsPipelineProps {
  initialClients: Client[];
}

const STAGES: { id: ClientStage; label: string; description: string; color: string }[] = [
  { id: "lead", label: "Lead / Prospect", description: "Initial contact or cold reel lead", color: "bg-[#7c7770]" },
  { id: "proposal", label: "Proposal Sent", description: "Pitch deck or quote submitted", color: "bg-[#bd9b4e]" },
  { id: "onboarding", label: "Onboarding", description: "Checklists & asset gathering", color: "bg-[#c8102e]" },
  { id: "active", label: "Active Project", description: "Design & build in production", color: "bg-[#16130f]" },
  { id: "retained", label: "Retained Client", description: "Monthly recurring retainer", color: "bg-[#16130f]" },
  { id: "archived", label: "Archived / Closed", description: "Completed or paused", color: "bg-[#ede8df]" },
];

export function ClientsPipeline({ initialClients }: ClientsPipelineProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<ClientStage>("lead");
  const [region, setRegion] = useState<Region>("global");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState("");

  const filteredClients = clients.filter((c) => {
    if (selectedRegion !== "all" && c.region !== selectedRegion) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCompany = c.company?.toLowerCase().includes(q);
      const matchEmail = c.contact_info?.email?.toLowerCase().includes(q);
      const matchTags = c.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchCompany && !matchEmail && !matchTags) return false;
    }
    return true;
  });

  const handleStageChange = async (clientId: string, newStage: ClientStage) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
    );
    await updateClientStageAction(clientId, newStage);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      if (company) formData.append("company", company);
      formData.append("stage", stage);
      formData.append("region", region);
      if (email) formData.append("email", email);
      if (whatsapp) formData.append("whatsapp", whatsapp);
      if (role) formData.append("role", role);

      const res = await createClientAction(formData);
      if (res.slug) {
        window.location.href = `/clients/${res.slug}`;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border-2 border-[#16130f]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7c7770] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by company, name, email, or region..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="label px-2 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs text-[#16130f] focus:outline-hidden"
          >
            <option value="all">All Regions</option>
            <option value="uae">UAE (Dubai/Abu Dhabi)</option>
            <option value="india">India</option>
            <option value="us">US / Global</option>
            <option value="global">Global</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#16130f] bg-[#f6f3ee]">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`p-1.5 transition-colors ${
                viewMode === "board" ? "bg-[#16130f] text-white" : "text-[#7c7770] hover:text-[#16130f]"
              }`}
              title="Pipeline Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 transition-colors ${
                viewMode === "table" ? "bg-[#16130f] text-white" : "text-[#7c7770] hover:text-[#16130f]"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="brutal-btn-red text-xs py-1.5 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <div className="brutal-card p-5 bg-[#faf8f5] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2 mb-4">
            <span className="label text-[#16130f]">New Client Workspace</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="label text-[#7c7770] hover:text-[#c8102e]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label text-[#7c7770] block mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Al Safa Hospitality"
                  className="w-full px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-sans focus:outline-hidden"
                />
              </div>

              <div>
                <label className="label text-[#7c7770] block mb-1">Primary Contact Person *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-sans focus:outline-hidden"
                />
              </div>

              <div>
                <label className="label text-[#7c7770] block mb-1">Contact Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Managing Director"
                  className="w-full px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-sans focus:outline-hidden"
                />
              </div>

              <div>
                <label className="label text-[#7c7770] block mb-1">Pipeline Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ClientStage)}
                  className="w-full px-2 py-2 bg-white border-2 border-[#16130f] text-xs font-mono uppercase font-bold focus:outline-hidden"
                >
                  <option value="lead">Lead</option>
                  <option value="proposal">Proposal</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="active">Active</option>
                  <option value="retained">Retained</option>
                </select>
              </div>

              <div>
                <label className="label text-[#7c7770] block mb-1">Target Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="w-full px-2 py-2 bg-white border-2 border-[#16130f] text-xs font-mono uppercase font-bold focus:outline-hidden"
                >
                  <option value="uae">UAE (Dubai/Abu Dhabi)</option>
                  <option value="india">India</option>
                  <option value="us">US / Global</option>
                  <option value="global">Global</option>
                </select>
              </div>

              <div>
                <label className="label text-[#7c7770] block mb-1">WhatsApp / Phone</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-mono focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ede8df]">
              <button
                type="submit"
                disabled={isPending}
                className="brutal-btn-red text-xs py-2 px-6"
              >
                {isPending ? "Creating Workspace..." : "Create Client Workspace"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Board View (Kanban) */}
      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {STAGES.map((s) => {
            const stageClients = filteredClients.filter((c) => c.stage === s.id);

            return (
              <div
                key={s.id}
                className="bg-[#faf8f5] border-2 border-[#16130f] p-3 space-y-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#16130f]">
                      {s.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white border border-[#16130f] px-1.5 py-0.5">
                    {stageClients.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {stageClients.length === 0 ? (
                    <div className="border border-dashed border-[#ede8df] p-4 text-center">
                      <span className="text-[11px] font-mono text-[#7c7770]">No clients</span>
                    </div>
                  ) : (
                    stageClients.map((client) => {
                      const completedCount = client.onboarding_checklist?.filter((i) => i.completed).length || 0;
                      const totalChecklist = client.onboarding_checklist?.length || 0;

                      return (
                        <div
                          key={client.id}
                          className="bg-white border-2 border-[#16130f] p-3 shadow-[2px_2px_0px_#16130f] space-y-2 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/clients/${client.slug}`}
                                className="font-display font-bold text-sm text-[#16130f] hover:text-[#c8102e] leading-tight block"
                              >
                                {client.company || client.name}
                              </Link>
                              {client.company && (
                                <p className="font-sans text-[11px] text-[#7c7770]">
                                  {client.name} {client.contact_info?.role && `(${client.contact_info.role})`}
                                </p>
                              )}
                            </div>

                            {client.region && <RegionBadge region={client.region} />}
                          </div>

                          {/* Quick checklist stats */}
                          {totalChecklist > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7c7770] bg-[#f6f3ee] px-2 py-1 border border-[#16130f]">
                              <CheckCircle2 className="w-3 h-3 text-[#16130f]" />
                              <span>
                                Onboarding: {completedCount}/{totalChecklist} done
                              </span>
                            </div>
                          )}

                          {/* Contact Quick Icons */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#ede8df]">
                            <div className="flex items-center gap-1.5">
                              {client.contact_info?.whatsapp && (
                                <a
                                  href={`https://wa.me/${client.contact_info.whatsapp.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3 text-[#25d366]" />
                                </a>
                              )}
                              {client.contact_info?.email && (
                                <a
                                  href={`mailto:${client.contact_info.email}`}
                                  className="p-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-colors"
                                  title="Email"
                                >
                                  <Mail className="w-3 h-3 text-[#16130f]" />
                                </a>
                              )}
                            </div>

                            {/* Stage Selector */}
                            <select
                              value={client.stage}
                              onChange={(e) => handleStageChange(client.id, e.target.value as ClientStage)}
                              className="text-[10px] font-mono uppercase font-bold bg-[#f6f3ee] border border-[#16130f] px-1 py-0.5 focus:outline-hidden"
                            >
                              <option value="lead">Lead</option>
                              <option value="proposal">Proposal</option>
                              <option value="onboarding">Onboard</option>
                              <option value="active">Active</option>
                              <option value="retained">Retained</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border-2 border-[#16130f] shadow-[3px_3px_0px_#16130f] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#16130f] bg-[#faf8f5]">
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f]">Client / Brand</th>
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f]">Stage</th>
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f]">Region</th>
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f]">Contact Info</th>
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f]">Onboarding</th>
                <th className="p-3 font-mono text-[11px] uppercase font-bold text-[#16130f] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[#ede8df] text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#7c7770] font-mono">
                    No clients found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const completedCount = client.onboarding_checklist?.filter((i) => i.completed).length || 0;
                  const totalChecklist = client.onboarding_checklist?.length || 0;

                  return (
                    <tr key={client.id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="p-3">
                        <Link
                          href={`/clients/${client.slug}`}
                          className="font-display font-bold text-sm text-[#16130f] hover:text-[#c8102e] block"
                        >
                          {client.company || client.name}
                        </Link>
                        {client.company && (
                          <span className="font-sans text-[11px] text-[#7c7770]">
                            {client.name} {client.contact_info?.role && `• ${client.contact_info.role}`}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <select
                          value={client.stage}
                          onChange={(e) => handleStageChange(client.id, e.target.value as ClientStage)}
                          className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] text-[#16130f] focus:outline-hidden"
                        >
                          <option value="lead">LEAD</option>
                          <option value="proposal">PROPOSAL</option>
                          <option value="onboarding">ONBOARDING</option>
                          <option value="active">ACTIVE</option>
                          <option value="retained">RETAINED</option>
                          <option value="archived">ARCHIVED</option>
                        </select>
                      </td>

                      <td className="p-3">
                        {client.region ? <RegionBadge region={client.region} /> : <span className="label">GLOBAL</span>}
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5 text-[11px] font-mono">
                          {client.contact_info?.email && (
                            <div className="text-[#16130f]">{client.contact_info.email}</div>
                          )}
                          {client.contact_info?.whatsapp && (
                            <div className="text-[#7c7770]">{client.contact_info.whatsapp}</div>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px]">
                        {totalChecklist > 0 ? (
                          <span className="px-2 py-0.5 bg-[#f6f3ee] border border-[#16130f] inline-block">
                            {completedCount}/{totalChecklist} steps
                          </span>
                        ) : (
                          <span className="text-[#7c7770]">No checklist</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <Link
                          href={`/clients/${client.slug}`}
                          className="p-1.5 px-2.5 bg-[#16130f] text-white font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1 hover:bg-[#c8102e] transition-colors"
                        >
                          <span>Workspace</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
