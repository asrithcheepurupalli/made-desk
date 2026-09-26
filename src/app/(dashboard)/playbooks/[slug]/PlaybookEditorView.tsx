"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  BookOpen,
  Sparkles,
  Tag,
  Globe,
  Save,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { BlockEditor, type EditorBlock } from "@/components/Editor/BlockEditor";
import { CategoryBadge, RegionBadge } from "@/components/StatusBadge";
import type { Playbook, PlaybookCategory, Region } from "@/lib/data/types";
import { updatePlaybookContentAction, deletePlaybookAction } from "../actions";

interface PlaybookEditorViewProps {
  playbook: Playbook;
}

export function PlaybookEditorView({ playbook }: PlaybookEditorViewProps) {
  const router = useRouter();
  const [title, setTitle] = useState(playbook.title);
  const [category, setCategory] = useState<PlaybookCategory>(playbook.category);
  const [region, setRegion] = useState<Region>(playbook.region || "global");
  const [summary, setSummary] = useState(playbook.summary || "");
  const [tags, setTags] = useState<string[]>(playbook.tags || []);
  const [newTagInput, setNewTagInput] = useState("");
  const [isDeleting, startDeleting] = useTransition();

  const handleSaveBlocks = async (blocks: EditorBlock[]) => {
    return await updatePlaybookContentAction(playbook.slug, blocks, {
      title,
      summary,
      category,
      region,
      tags,
    });
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updatePlaybookContentAction(playbook.slug, playbook.content, {
      title: newTitle,
    });
  };

  const handleCategoryChange = async (newCat: PlaybookCategory) => {
    setCategory(newCat);
    await updatePlaybookContentAction(playbook.slug, playbook.content, {
      category: newCat,
    });
  };

  const handleRegionChange = async (newReg: Region) => {
    setRegion(newReg);
    await updatePlaybookContentAction(playbook.slug, playbook.content, {
      region: newReg,
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const updatedTags = Array.from(new Set([...tags, newTagInput.trim().toLowerCase()]));
      setTags(updatedTags);
      setNewTagInput("");
      updatePlaybookContentAction(playbook.slug, playbook.content, { tags: updatedTags });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    updatePlaybookContentAction(playbook.slug, playbook.content, { tags: updatedTags });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this agency playbook?")) return;

    startDeleting(async () => {
      await deletePlaybookAction(playbook.slug);
      router.push("/playbooks");
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#16130f] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/playbooks"
            className="p-1.5 bg-white border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all shadow-[2px_2px_0px_#16130f]"
            title="Back to Playbooks"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="label text-[#7c7770]">Playbook Document</span>
              <span className="text-xs text-[#7c7770]">/</span>
              <span className="font-mono text-xs font-bold text-[#c8102e] uppercase">{playbook.slug}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 px-3 bg-white border border-[#16130f] text-[#c8102e] hover:bg-[#fbe8eb] font-mono text-xs uppercase font-bold flex items-center gap-1.5 transition-all"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Delete SOP</span>
          </button>
        </div>
      </div>

      {/* Metadata Configuration Box */}
      <div className="bg-white border-2 border-[#16130f] shadow-[3px_3px_0px_#16130f] p-5 space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Playbook Title..."
            className="w-full font-display font-black text-2xl sm:text-3xl text-[#16130f] tracking-tight bg-transparent border-none focus:outline-hidden"
          />
        </div>

        {/* Category & Region Selectors */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#ede8df]">
          <div className="flex items-center gap-2">
            <span className="label text-[#7c7770]">Category:</span>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as PlaybookCategory)}
              className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] text-[#16130f] focus:outline-hidden"
            >
              <option value="acquisition">ACQUISITION</option>
              <option value="onboarding">ONBOARDING</option>
              <option value="outreach">OUTREACH</option>
              <option value="delivery">DELIVERY</option>
              <option value="pricing">PRICING</option>
              <option value="operations">OPERATIONS</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="label text-[#7c7770]">Region:</span>
            <select
              value={region}
              onChange={(e) => handleRegionChange(e.target.value as Region)}
              className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] text-[#16130f] focus:outline-hidden"
            >
              <option value="global">GLOBAL</option>
              <option value="uae">UAE (DUBAI/ABU DHABI)</option>
              <option value="india">INDIA</option>
              <option value="us">US / NORTH AMERICA</option>
            </select>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
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

        {/* Summary Textarea */}
        <div className="pt-2 border-t border-[#ede8df]">
          <label className="label text-[#7c7770] block mb-1">Executive Summary / Usage Context</label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              updatePlaybookContentAction(playbook.slug, playbook.content, { summary: e.target.value });
            }}
            placeholder="When and how our agency should follow this standard operating procedure..."
            className="w-full p-2 bg-[#f6f3ee] border border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* Notion-Style Block Editor */}
      <BlockEditor
        initialBlocks={playbook.content}
        onSave={handleSaveBlocks}
      />
    </div>
  );
}
