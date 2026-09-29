"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Globe,
  Tag,
  ArrowUpRight,
  Sparkles,
  Layers,
  FileText,
} from "lucide-react";
import { CategoryBadge, RegionBadge } from "@/components/StatusBadge";
import type { Playbook, PlaybookCategory, Region } from "@/lib/data/types";
import { createPlaybookAction } from "./actions";

interface PlaybooksListProps {
  initialPlaybooks: Playbook[];
}

export function PlaybooksList({ initialPlaybooks }: PlaybooksListProps) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks);
  React.useEffect(() => {
    setPlaybooks(initialPlaybooks);
  }, [initialPlaybooks]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<PlaybookCategory>("acquisition");
  const [newRegion, setNewRegion] = useState<Region>("global");
  const [newSummary, setNewSummary] = useState("");

  const categories: { id: string; label: string }[] = [
    { id: "all", label: "All SOPs" },
    { id: "acquisition", label: "Acquisition" },
    { id: "onboarding", label: "Onboarding" },
    { id: "outreach", label: "Outreach" },
    { id: "delivery", label: "Delivery" },
    { id: "pricing", label: "Pricing" },
    { id: "operations", label: "Operations" },
  ];

  const regions: { id: string; label: string }[] = [
    { id: "all", label: "All Regions" },
    { id: "uae", label: "UAE (Dubai/Abu Dhabi)" },
    { id: "india", label: "India" },
    { id: "us", label: "US / Global" },
    { id: "global", label: "Global" },
  ];

  const filtered = playbooks.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (selectedRegion !== "all" && p.region !== selectedRegion) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSummary = p.summary?.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchTags) return false;
    }
    return true;
  });

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("category", newCategory);
    formData.append("region", newRegion);
    if (newSummary) formData.append("summary", newSummary);

    const res = await createPlaybookAction(formData);
    if (res.slug) {
      window.location.href = `/playbooks/${res.slug}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border-2 border-[#16130f]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7c7770] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playbooks, tactics, tags, or client SOPs..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs font-sans focus:outline-hidden focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="label px-2 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs text-[#16130f] focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Region Dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="label px-2 py-1.5 bg-[#f6f3ee] border border-[#16130f] text-xs text-[#16130f] focus:outline-hidden"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="brutal-btn-red text-xs py-1.5 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New SOP</span>
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <div className="brutal-card p-5 bg-[#faf8f5] animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b-2 border-[#16130f] pb-2 mb-4">
            <span className="label text-[#16130f]">Draft New Agency SOP</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="label text-[#7c7770] hover:text-[#c8102e]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateNew} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playbook Title (e.g., Enterprise Retainer Outreach via LinkedIn)"
                className="md:col-span-6 px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-[#c8102e]"
              />

              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PlaybookCategory)}
                className="md:col-span-3 px-2 py-2 bg-white border-2 border-[#16130f] text-xs font-mono uppercase font-bold focus:outline-hidden"
              >
                <option value="acquisition">Acquisition</option>
                <option value="onboarding">Onboarding</option>
                <option value="outreach">Outreach</option>
                <option value="delivery">Delivery</option>
                <option value="pricing">Pricing</option>
                <option value="operations">Operations</option>
              </select>

              <select
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value as Region)}
                className="md:col-span-3 px-2 py-2 bg-white border-2 border-[#16130f] text-xs font-mono uppercase font-bold focus:outline-hidden"
              >
                <option value="global">Global</option>
                <option value="uae">UAE</option>
                <option value="india">India</option>
                <option value="us">US</option>
              </select>
            </div>

            <textarea
              rows={2}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Brief summary or context of when and how to apply this playbook..."
              className="w-full px-3 py-2 bg-white border-2 border-[#16130f] text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-[#c8102e] resize-none"
            />

            <div className="flex justify-end">
              <button type="submit" className="brutal-btn-red text-xs py-2 px-6">
                Create & Open Editor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Playbooks Grid */}
      {filtered.length === 0 ? (
        <div className="brutal-card p-12 bg-white text-center">
          <BookOpen className="w-8 h-8 text-[#7c7770] mx-auto mb-2" />
          <h4 className="font-display font-bold text-base text-[#16130f]">
            No Playbooks Found
          </h4>
          <p className="font-sans text-xs text-[#7c7770] mt-1">
            Try adjusting your search query or create a new SOP guide.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((playbook) => {
            const blockCount = Array.isArray(playbook.content) ? playbook.content.length : 0;

            return (
              <Link
                key={playbook.id}
                href={`/playbooks/${playbook.slug}`}
                className="brutal-card bg-white p-5 flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#16130f] transition-all group"
              >
                <div>
                  {/* Top metadata tags */}
                  <div className="flex items-center justify-between gap-2 border-b-2 border-[#16130f] pb-2 mb-3">
                    <CategoryBadge category={playbook.category} />
                    {playbook.region && <RegionBadge region={playbook.region} />}
                  </div>

                  {/* Title & Summary */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-[#16130f] leading-snug group-hover:text-[#c8102e] transition-colors">
                        {playbook.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-[#7c7770] group-hover:text-[#c8102e] shrink-0 mt-1 transition-colors" />
                    </div>

                    {playbook.summary && (
                      <p className="font-sans text-xs text-[#7c7770] line-clamp-3 leading-relaxed">
                        {playbook.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Tags and Block Count */}
                <div className="pt-4 mt-4 border-t border-[#ede8df] flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {playbook.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="label px-1.5 py-0.5 bg-[#f6f3ee] border border-[#16130f]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className="shrink-0 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{blockCount} blocks</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
