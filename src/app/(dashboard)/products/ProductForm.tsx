"use client";

import React, { useState } from "react";
import { X, ImagePlus, Trash2 } from "lucide-react";
import { saveProduct, removeProduct } from "@/lib/data/products";
import type { Product, ProductOwner, ProductStatus, ProductType } from "@/lib/data/types";

const TYPES: ProductType[] = ["Product", "Concept study", "Client build", "Pitch demo", "Case study", "Tool", "Experiment", "Venture", "Internal"];
const STATUSES: Array<[ProductStatus, string]> = [
  ["live", "Live"],
  ["beta", "Beta"],
  ["concept", "Upcoming"],
  ["source_only", "Source only"],
  ["down", "Link down"],
];

/** Shrink an uploaded image to a small JPEG data URI so it stays light in browser storage. */
async function toDataUri(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 900 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.78);
}

const field = "w-full border-2 border-[#16130f] bg-white px-3 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-[#c8102e]";
const lbl = "label text-[#7c7770] block mb-1";

export function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [f, setF] = useState({
    name: product?.name || "",
    owner: (product?.owner || "made") as ProductOwner,
    type: (product?.type || "Product") as ProductType,
    status: (product?.status || "live") as ProductStatus,
    url: product?.url || "",
    repo: product?.repo || "",
    tagline: product?.tagline || "",
    description: product?.description || "",
    tags: (product?.tags || []).join(", "),
    image: product?.image || "",
    note: product?.note || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr("A name is required.");
    setBusy(true);
    try {
      await saveProduct({
        ...(product ? { id: product.id } : {}),
        ...f,
        name: f.name.trim(),
        tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
        checked_at: new Date().toISOString().slice(0, 10),
      });
      onClose();
    } catch {
      setErr("Could not save. Browser storage may be full.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={save} className="bg-[#f6f3ee] border-2 border-[#16130f] shadow-[6px_6px_0px_#16130f] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b-2 border-[#16130f] bg-white">
          <h3 className="font-display font-black text-xl text-[#16130f]">{product ? "Edit product" : "Add product"}</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {err && <p className="sm:col-span-2 p-2 border-2 border-[#c8102e] bg-[#fbe8eb] text-[#c8102e] text-xs font-mono font-bold">{err}</p>}
          <div className="sm:col-span-2">
            <label className={lbl}>Name</label>
            <input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. made. table" />
          </div>
          <div>
            <label className={lbl}>Belongs to</label>
            <select className={field} value={f.owner} onChange={(e) => set("owner", e.target.value)}>
              <option value="made">made.</option>
              <option value="asrith">Asrith (personal)</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Type</label>
            <select className={field} value={f.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={field} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Tags (comma separated)</label>
            <input className={field} value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="AI, privacy" />
          </div>
          <div>
            <label className={lbl}>Live link</label>
            <input className={field} value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
          </div>
          <div>
            <label className={lbl}>Code link</label>
            <input className={field} value={f.repo} onChange={(e) => set("repo", e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>One-line tagline</label>
            <input className={field} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Description</label>
            <textarea className={field} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Image (link, or upload a screenshot)</label>
            <div className="flex gap-2">
              <input className={field} value={f.image.startsWith("data:") ? "(uploaded image)" : f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://... or /products/name.jpg" />
              <label className="shrink-0 inline-flex items-center gap-1.5 border-2 border-[#16130f] bg-white px-3 font-mono text-[10px] font-bold uppercase cursor-pointer hover:bg-[#ede8df]">
                <ImagePlus className="w-3.5 h-3.5" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) set("image", await toDataUri(file));
                  }}
                />
              </label>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Note (shown on the card, e.g. a caveat)</label>
            <input className={field} value={f.note} onChange={(e) => set("note", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-4 border-t-2 border-[#16130f] bg-white">
          {product ? (
            <button
              type="button"
              onClick={async () => {
                if (confirm(`Remove ${product.name} from the hall?`)) {
                  await removeProduct(product.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-[#c8102e] underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          ) : (
            <span />
          )}
          <button type="submit" disabled={busy} className="bg-[#16130f] text-[#f6f3ee] font-mono text-xs uppercase px-5 py-2 border-2 border-[#16130f] hover:bg-[#c8102e] transition-colors disabled:opacity-50">
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
