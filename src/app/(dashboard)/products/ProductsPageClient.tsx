"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Rocket, Plus, Search, ArrowUpRight, Code2, Pencil } from "lucide-react";
import { useStoreQuery } from "@/lib/store/useStore";
import { listProducts, ensureProductSeed } from "@/lib/data/products";
import { PageLoading } from "@/components/PageLoading";
import { ProductForm } from "./ProductForm";
import type { Product, ProductOwner, ProductStatus } from "@/lib/data/types";

const STATUS_LABEL: Record<ProductStatus, string> = { live: "Live", beta: "Beta", concept: "Upcoming", source_only: "Source only", down: "Link down" };
const TYPE_ORDER = ["Product", "Venture", "Client build", "Concept study", "Pitch demo", "Case study", "Internal", "Tool", "Experiment"];

function Tile({ name }: { name: string }) {
  return (
    <div className="w-full h-full bg-[#16130f] flex items-center justify-center p-4">
      <span className="font-display font-semibold italic text-2xl text-[#f6f3ee] text-center leading-tight">
        {name.replace(/\.$/, "")}
        <span className="not-italic text-[#c8102e]">.</span>
      </span>
    </div>
  );
}

function Card({ p, onEdit }: { p: Product; onEdit: () => void }) {
  const [imgOk, setImgOk] = useState(true);
  const statusCls =
    p.status === "down" ? "bg-[#c8102e] text-white" : p.status === "live" ? "bg-[#16130f] text-[#f6f3ee]" : "bg-[#bd9b4e] text-white";
  return (
    <article className="brutal-card bg-white flex flex-col">
      <div className="relative aspect-video border-b-2 border-[#16130f] overflow-hidden bg-[#ede8df]">
        {p.image && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={`${p.name} preview`} loading="lazy" onError={() => setImgOk(false)} className="w-full h-full object-cover object-top" />
        ) : (
          <Tile name={p.name} />
        )}
        <span className={`absolute top-2 left-2 label px-2 py-0.5 border border-[#16130f] ${statusCls}`}>{STATUS_LABEL[p.status]}</span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${p.name}`}
          className="absolute top-2 right-2 bg-white border border-[#16130f] p-1.5 hover:bg-[#ede8df]"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg text-[#16130f] leading-snug">{p.name}</h3>
          <span className="label bg-[#ede8df] text-[#16130f] px-2 py-0.5 border border-[#16130f] shrink-0">{p.type}</span>
        </div>
        {p.tagline && <p className="font-sans text-xs font-semibold text-[#16130f]">{p.tagline}</p>}
        <p className="font-sans text-xs text-[#7c7770] leading-relaxed line-clamp-4">{p.description}</p>
        {p.note && <p className="font-mono text-[10px] text-[#c8102e] leading-snug">{p.note}</p>}
        {p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.slice(0, 4).map((t) => (
              <span key={t} className="font-mono text-[10px] text-[#7c7770] border border-[#e4ddd0] px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#16130f] text-[#f6f3ee] font-mono text-[11px] uppercase px-3 py-1.5 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors"
            >
              Visit <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          {p.repo && (
            <a
              href={p.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white font-mono text-[11px] uppercase px-3 py-1.5 border-2 border-[#16130f] hover:bg-[#ede8df]"
            >
              <Code2 className="w-3 h-3" /> Code
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductsPageClient() {
  const products = useStoreQuery(listProducts);
  const [owner, setOwner] = useState<"all" | ProductOwner>("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null | "new">(null);

  // First visit: load the researched products (a no-op once they exist)
  useEffect(() => {
    ensureProductSeed();
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return (products || [])
      .filter((p) => (owner === "all" || p.owner === owner) && (type === "all" || p.type === type))
      .filter((p) => !term || `${p.name} ${p.tagline} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(term))
      .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.name.localeCompare(b.name));
  }, [products, owner, type, q]);

  if (!products) return <PageLoading />;

  const count = (o: ProductOwner) => products.filter((p) => p.owner === o).length;
  const types = TYPE_ORDER.filter((t) => products.some((p) => p.type === t));
  const sections: Array<[ProductOwner, string]> = [
    ["made", "Built under made."],
    ["asrith", "Asrith's personal projects"],
  ];
  const chip = (active: boolean) =>
    `font-mono text-[11px] uppercase px-3 py-1.5 border-2 border-[#16130f] transition-colors ${active ? "bg-[#16130f] text-[#f6f3ee]" : "bg-white hover:bg-[#ede8df]"}`;

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-[#16130f] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#c8102e]" />
            <span className="label text-[#7c7770]">Pillar 07 / Everything we shipped</span>
          </div>
          <h1 className="font-display font-black text-3xl tracking-tight text-[#16130f] mt-1">Hall of Products</h1>
          <p className="font-sans text-xs text-[#7c7770] mt-1 max-w-xl">
            Every product, client build, concept and tool, under made. and as Asrith&apos;s personal work. Claude reads this list too.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[
            ["Total", products.length],
            ["made.", count("made")],
            ["Personal", count("asrith")],
            ["Live", products.filter((p) => p.status === "live").length],
          ].map(([l, n]) => (
            <div key={l as string} className="bg-white border-2 border-[#16130f] px-3.5 py-2 shadow-[2px_2px_0px_#16130f]">
              <p className="label text-[#7c7770]">{l}</p>
              <p className="font-mono font-bold text-xl text-[#16130f]">{n}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className={chip(owner === "all")} onClick={() => setOwner("all")}>
            All
          </button>
          <button className={chip(owner === "made")} onClick={() => setOwner("made")}>
            made.
          </button>
          <button className={chip(owner === "asrith")} onClick={() => setOwner("asrith")}>
            Asrith
          </button>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7770]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="w-full border-2 border-[#16130f] bg-white pl-9 pr-3 py-1.5 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
            />
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 bg-[#c8102e] text-white font-mono text-[11px] uppercase px-3 py-1.5 border-2 border-[#16130f] shadow-[2px_2px_0px_#16130f]"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={chip(type === "all")} onClick={() => setType("all")}>
            All types
          </button>
          {types.map((t) => (
            <button key={t} className={chip(type === t)} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="brutal-card p-12 bg-white text-center font-sans text-xs text-[#7c7770]">Nothing matches that filter.</div>
      ) : (
        sections.map(([o, title]) => {
          const list = filtered.filter((p) => p.owner === o);
          if (!list.length) return null;
          return (
            <section key={o} className="space-y-4">
              <h2 className="font-display font-bold text-xl text-[#16130f] flex items-baseline gap-2">
                {title} <span className="font-mono text-xs text-[#7c7770]">{list.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {list.map((p) => (
                  <Card key={p.id} p={p} onEdit={() => setEditing(p)} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <p className="font-mono text-[10px] text-[#7c7770]">
        Researched from made-by-ac.com, asrithcheepurupalli.tech, GitHub and our notes. Statuses checked {products[0]?.checked_at || "recently"}. LinkedIn has no projects listed.
      </p>

      {editing && <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
