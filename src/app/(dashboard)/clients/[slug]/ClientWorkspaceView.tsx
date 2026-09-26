"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Users,
  CheckCircle2,
  Circle,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  Tag,
} from "lucide-react";
import { BlockEditor, type EditorBlock } from "@/components/Editor/BlockEditor";
import { StageBadge, RegionBadge } from "@/components/StatusBadge";
import type { Client, ClientStage, Region, OnboardingChecklistItem, NextAction } from "@/lib/data/types";
import {
  updateClientWorkspaceAction,
  updateClientStageAction,
  toggleClientChecklistItemAction,
  addClientChecklistItemAction,
  deleteClientChecklistItemAction,
  deleteClientAction,
} from "../actions";

interface ClientWorkspaceViewProps {
  client: Client;
  linkedActions: NextAction[];
}

export function ClientWorkspaceView({ client, linkedActions }: ClientWorkspaceViewProps) {
  const router = useRouter();
  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company || "");
  const [stage, setStage] = useState<ClientStage>(client.stage);
  const [region, setRegion] = useState<Region>(client.region || "global");
  const [email, setEmail] = useState(client.contact_info?.email || "");
  const [phone, setPhone] = useState(client.contact_info?.phone || "");
  const [whatsapp, setWhatsapp] = useState(client.contact_info?.whatsapp || "");
  const [role, setRole] = useState(client.contact_info?.role || "");
  const [website, setWebsite] = useState(client.contact_info?.website || "");
  const [tags, setTags] = useState<string[]>(client.tags || []);
  const [newTagInput, setNewTagInput] = useState("");

  // Checklist state
  const [checklist, setChecklist] = useState<OnboardingChecklistItem[]>(client.onboarding_checklist || []);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [isDeleting, startDeleting] = useTransition();

  const completedChecklistCount = checklist.filter((i) => i.completed).length;
  const totalChecklistCount = checklist.length;
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  const handleSaveBlocks = async (blocks: EditorBlock[]) => {
    return await updateClientWorkspaceAction(client.slug, blocks, {
      name,
      company,
      stage,
      region,
      contact_info: {
        email,
        phone,
        whatsapp,
        role,
        website,
      },
      tags,
    });
  };

  const handleStageChange = async (newStage: ClientStage) => {
    setStage(newStage);
    await updateClientStageAction(client.id, newStage);
  };

  const handleToggleChecklist = async (taskId: string, currentCompleted: boolean) => {
    const updated = checklist.map((item) =>
      item.id === taskId
        ? {
            ...item,
            completed: !currentCompleted,
            sent_at: !currentCompleted ? new Date().toISOString() : undefined,
          }
        : item
    );
    setChecklist(updated);
    await toggleClientChecklistItemAction(client.id, taskId, !currentCompleted);
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    const taskText = newTaskInput.trim();
    const tempId = `chk-${Date.now()}`;
    const newItem: OnboardingChecklistItem = {
      id: tempId,
      task: taskText,
      completed: false,
    };

    setChecklist([...checklist, newItem]);
    setNewTaskInput("");
    setIsAddingTask(false);

    await addClientChecklistItemAction(client.id, taskText);
  };

  const handleDeleteChecklistItem = async (taskId: string) => {
    setChecklist(checklist.filter((i) => i.id !== taskId));
    await deleteClientChecklistItemAction(client.id, taskId);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const updatedTags = Array.from(new Set([...tags, newTagInput.trim().toLowerCase()]));
      setTags(updatedTags);
      setNewTagInput("");
      updateClientWorkspaceAction(client.slug, client.content, { tags: updatedTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    updateClientWorkspaceAction(client.slug, client.content, { tags: updatedTags });
  };

  const handleDeleteClient = () => {
    if (!window.confirm(`Are you sure you want to delete the workspace for ${company || name}?`)) return;

    startDeleting(async () => {
      await deleteClientAction(client.id);
      router.push("/clients");
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#16130f] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="p-1.5 bg-white border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all shadow-[2px_2px_0px_#16130f]"
            title="Back to Clients"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="label text-[#7c7770]">Client Workspace</span>
              <span className="text-xs text-[#7c7770]">/</span>
              <span className="font-mono text-xs font-bold text-[#c8102e] uppercase">{client.slug}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={stage}
            onChange={(e) => handleStageChange(e.target.value as ClientStage)}
            className="label px-3 py-1.5 bg-white border-2 border-[#16130f] text-[#16130f] font-mono uppercase font-bold focus:outline-hidden shadow-[2px_2px_0px_#16130f]"
          >
            <option value="lead">STAGE: LEAD</option>
            <option value="proposal">STAGE: PROPOSAL</option>
            <option value="onboarding">STAGE: ONBOARDING</option>
            <option value="active">STAGE: ACTIVE</option>
            <option value="retained">STAGE: RETAINED</option>
            <option value="archived">STAGE: ARCHIVED</option>
          </select>

          <button
            type="button"
            onClick={handleDeleteClient}
            disabled={isDeleting}
            className="p-1.5 px-3 bg-white border-2 border-[#16130f] text-[#c8102e] hover:bg-[#fbe8eb] font-mono text-xs uppercase font-bold flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#16130f]"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white border-2 border-[#16130f] shadow-[3px_3px_0px_#16130f] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <input
              type="text"
              value={company || name}
              onChange={(e) => {
                setCompany(e.target.value);
                updateClientWorkspaceAction(client.slug, client.content, { company: e.target.value });
              }}
              placeholder="Company Name..."
              className="font-display font-black text-2xl sm:text-3xl text-[#16130f] tracking-tight bg-transparent border-none focus:outline-hidden w-full"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="label text-[#7c7770]">Contact:</span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  updateClientWorkspaceAction(client.slug, client.content, { name: e.target.value });
                }}
                placeholder="Primary Contact..."
                className="font-sans text-xs font-semibold text-[#16130f] bg-transparent border-b border-dashed border-[#7c7770] focus:outline-hidden"
              />
              {role && <span className="font-sans text-xs text-[#7c7770]">({role})</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={stage} />
            <RegionBadge region={region} />
          </div>
        </div>

        {/* Quick Contact Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#ede8df]">
          {/* WhatsApp Direct */}
          <div className="flex items-center justify-between p-2.5 bg-[#f6f3ee] border border-[#16130f]">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="w-4 h-4 text-[#25d366] shrink-0" />
              <div className="min-w-0">
                <span className="label text-[#7c7770] block">WhatsApp</span>
                <span className="font-mono text-xs font-bold text-[#16130f] truncate block">
                  {whatsapp || "Not set"}
                </span>
              </div>
            </div>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 bg-white border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-colors"
                title="Open WhatsApp Chat"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Email Direct */}
          <div className="flex items-center justify-between p-2.5 bg-[#f6f3ee] border border-[#16130f]">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-[#16130f] shrink-0" />
              <div className="min-w-0">
                <span className="label text-[#7c7770] block">Email</span>
                <span className="font-mono text-xs font-bold text-[#16130f] truncate block">
                  {email || "Not set"}
                </span>
              </div>
            </div>
            {email && (
              <a
                href={`mailto:${email}`}
                className="p-1 bg-white border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-colors"
                title="Send Email"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-2.5 bg-[#f6f3ee] border border-[#16130f]">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-4 h-4 text-[#16130f] shrink-0" />
              <div className="min-w-0">
                <span className="label text-[#7c7770] block">Phone</span>
                <span className="font-mono text-xs font-bold text-[#16130f] truncate block">
                  {phone || whatsapp || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center justify-between p-2.5 bg-[#f6f3ee] border border-[#16130f]">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-[#16130f] shrink-0" />
              <div className="min-w-0">
                <span className="label text-[#7c7770] block">Website / Brand</span>
                <span className="font-mono text-xs font-bold text-[#16130f] truncate block">
                  {website || "Not set"}
                </span>
              </div>
            </div>
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 bg-white border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-colors"
                title="Open Website"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-[#ede8df]">
          <span className="label text-[#7c7770]">Tags:</span>
          {tags.map((t) => (
            <span
              key={t}
              className="label px-1.5 py-0.5 bg-[#f6f3ee] border border-[#16130f] flex items-center gap-1"
            >
              #{t}
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-[#c8102e]"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ tag (enter)"
            className="px-1.5 py-0.5 bg-transparent border-b border-dashed border-[#7c7770] text-[11px] font-mono focus:outline-hidden w-24"
          />
        </div>
      </div>

      {/* Onboarding Checklist & Linked Next Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Onboarding Checklist Box (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-[#16130f] shadow-[3px_3px_0px_#16130f] p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#c8102e]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#16130f]">
                Client Onboarding Milestones
              </span>
            </div>

            <span className="font-mono text-xs font-bold bg-[#f6f3ee] border border-[#16130f] px-2 py-0.5">
              {completedChecklistCount}/{totalChecklistCount} ({checklistPercentage}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#f6f3ee] border border-[#16130f] h-2">
            <div
              className="bg-[#c8102e] h-full transition-all duration-300"
              style={{ width: `${checklistPercentage}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`p-3 border-2 border-[#16130f] flex items-start justify-between gap-3 transition-colors ${
                  item.completed ? "bg-[#faf8f5] opacity-75" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id, item.completed)}
                    className="mt-0.5 text-[#16130f] hover:text-[#c8102e] shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16130f] fill-[#16130f] text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#7c7770]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`font-sans text-xs font-medium ${
                        item.completed ? "line-through text-[#7c7770]" : "text-[#16130f]"
                      }`}
                    >
                      {item.task}
                    </p>
                    {item.sent_at && (
                      <span className="text-[10px] font-mono text-[#7c7770] block mt-0.5">
                        Completed {new Date(item.sent_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="text-[#7c7770] hover:text-[#c8102e] text-xs font-mono shrink-0 px-1"
                  title="Remove Item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add Item Form */}
          {isAddingTask ? (
            <form onSubmit={handleAddChecklistItem} className="pt-2 border-t border-[#ede8df] flex gap-2">
              <input
                type="text"
                required
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="New onboarding milestone (e.g., Send Figma invitation)..."
                className="flex-1 px-3 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white"
              />
              <button type="submit" className="brutal-btn-red text-xs py-1.5 px-3">
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="label px-2 text-[#7c7770] hover:text-[#16130f]"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="w-full py-2 bg-[#f6f3ee] border border-dashed border-[#16130f] font-mono text-xs uppercase font-bold text-[#7c7770] hover:text-[#16130f] hover:bg-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Milestone</span>
            </button>
          )}
        </div>

        {/* Linked Next Actions (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-[#16130f] shadow-[3px_3px_0px_#16130f] p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#bd9b4e]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#16130f]">
                Open Client Tasks
              </span>
            </div>

            <Link
              href="/actions"
              className="label text-[#7c7770] hover:text-[#c8102e] flex items-center gap-1"
            >
              <span>View Board</span>
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </div>

          {linkedActions.length === 0 ? (
            <div className="p-6 border border-dashed border-[#ede8df] text-center">
              <p className="font-sans text-xs text-[#7c7770]">No pending action items for this client.</p>
              <Link
                href="/actions"
                className="mt-2 inline-block font-mono text-[11px] font-bold text-[#c8102e] hover:underline uppercase"
              >
                + Create Task in Actions
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3 bg-[#faf8f5] border border-[#16130f] space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-sans text-xs font-bold text-[#16130f] leading-snug">
                      {action.title}
                    </span>
                    <span className="label px-1 py-0.2 bg-white border border-[#16130f] text-[9px] uppercase shrink-0">
                      {action.priority}
                    </span>
                  </div>
                  {action.description && (
                    <p className="font-sans text-[11px] text-[#7c7770] line-clamp-2">
                      {action.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notion-Style Workspace Notes Document */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#16130f]" />
            <h3 className="font-display font-bold text-lg text-[#16130f]">
              Workspace Document & Deliverable Notes
            </h3>
          </div>
          <span className="label text-[#7c7770]">Notion-Style Block Editor</span>
        </div>

        <BlockEditor
          initialBlocks={client.content}
          onSave={handleSaveBlocks}
        />
      </div>
    </div>
  );
}
