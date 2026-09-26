"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  ListOrdered,
  AlertTriangle,
  Code2,
  Minus,
  Save,
  Check,
  Loader2,
  Copy,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

export type BlockType =
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "paragraph"
  | "bullet_list"
  | "numbered_list"
  | "todo"
  | "callout"
  | "code_snippet"
  | "image"
  | "divider";

export interface EditorBlock {
  id: string;
  type: BlockType;
  text: string;
  url?: string;
  checked?: boolean;
  language?: string;
}

interface BlockEditorProps {
  initialBlocks: any[];
  onSave?: (blocks: EditorBlock[]) => Promise<any>;
  readOnly?: boolean;
}

// Convert any incoming schema (BlockNote or simplified array) to standard EditorBlock[]
function normalizeBlocks(incoming: any[]): EditorBlock[] {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return [
      { id: "b-1", type: "heading_1", text: "New Operational Guide" },
      { id: "b-2", type: "paragraph", text: "Write the details and SOP steps here..." },
    ];
  }

  return incoming.map((block, idx) => {
    // If it's already an EditorBlock
    if (block.id && block.type && typeof block.text === "string") {
      return block as EditorBlock;
    }

    // If it's BlockNote-style { type, content: [{ text }], props: { level } }
    let type: BlockType = "paragraph";
    let text = "";
    let url = block.url || "";
    let checked = false;

    if (block.type === "heading") {
      const level = block.props?.level || 1;
      type = level === 1 ? "heading_1" : level === 2 ? "heading_2" : "heading_3";
    } else if (block.type === "bulletListItem") {
      type = "bullet_list";
    } else if (block.type === "numberedListItem") {
      type = "numbered_list";
    } else if (block.type === "checkListItem") {
      type = "todo";
      checked = !!block.props?.checked;
    } else if (block.type === "callout") {
      type = "callout";
    } else if (block.type === "codeBlock") {
      type = "code_snippet";
    } else if (block.type === "image") {
      type = "image";
      url = block.url || block.props?.url || "";
    } else if (block.type === "divider") {
      type = "divider";
    } else {
      type = "paragraph";
    }

    if (Array.isArray(block.content)) {
      text = block.content.map((c: any) => c.text || "").join("");
    } else if (typeof block.text === "string") {
      text = block.text;
    }

    return {
      id: block.id || `b-${Date.now()}-${idx}`,
      type,
      text,
      url,
      checked,
    };
  });
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "paragraph", label: "Text Paragraph", icon: AlignLeft },
  { type: "heading_1", label: "Heading 1 (Large)", icon: Heading1 },
  { type: "heading_2", label: "Heading 2 (Medium)", icon: Heading2 },
  { type: "heading_3", label: "Heading 3 (Small)", icon: Heading3 },
  { type: "bullet_list", label: "Bullet Point", icon: List },
  { type: "numbered_list", label: "Numbered Step", icon: ListOrdered },
  { type: "todo", label: "Checklist Item", icon: CheckSquare },
  { type: "callout", label: "Callout / Rule Box", icon: AlertTriangle },
  { type: "image", label: "Visual / Keyframe", icon: ImageIcon },
  { type: "code_snippet", label: "Template / Script", icon: Code2 },
  { type: "divider", label: "Section Divider", icon: Minus },
];

export function BlockEditor({ initialBlocks, onSave, readOnly = false }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => normalizeBlocks(initialBlocks));
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when initialBlocks changes externally
  useEffect(() => {
    setBlocks(normalizeBlocks(initialBlocks));
  }, [initialBlocks]);

  const triggerAutoSave = useCallback(
    (currentBlocks: EditorBlock[]) => {
      if (!onSave || readOnly) return;
      setSaveStatus("unsaved");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await onSave(currentBlocks);
          setSaveStatus("saved");
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("unsaved");
        }
      }, 1200);
    },
    [onSave, readOnly]
  );

  const handleManualSave = async () => {
    if (!onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(blocks);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Manual save failed:", err);
      setSaveStatus("unsaved");
    }
  };

  const updateBlockText = (id: string, text: string) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, text } : b));
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const updateBlockType = (id: string, type: BlockType) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, type } : b));
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const toggleTodoCheck = (id: string) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b));
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const addBlockAfter = (index: number, type: BlockType = "paragraph") => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      text: "",
      checked: false,
    };
    const updated = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
    setBlocks(updated);
    setActiveBlockId(newBlock.id);
    triggerAutoSave(updated);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      // Keep at least one empty block
      const reset = [{ id: "b-root", type: "paragraph" as BlockType, text: "" }];
      setBlocks(reset);
      triggerAutoSave(reset);
      return;
    }
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    setBlocks(copy);
    triggerAutoSave(copy);
  };

  const copyAsMarkdown = () => {
    const md = blocks
      .map((b) => {
        if (b.type === "heading_1") return `# ${b.text}\n`;
        if (b.type === "heading_2") return `## ${b.text}\n`;
        if (b.type === "heading_3") return `### ${b.text}\n`;
        if (b.type === "bullet_list") return `- ${b.text}`;
        if (b.type === "numbered_list") return `1. ${b.text}`;
        if (b.type === "todo") return `- [${b.checked ? "x" : " "}] ${b.text}`;
        if (b.type === "callout") return `> **NOTE:** ${b.text}\n`;
        if (b.type === "code_snippet") return `\`\`\`\n${b.text}\n\`\`\`\n`;
        if (b.type === "divider") return `---\n`;
        return `${b.text}\n`;
      })
      .join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Editor Top Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-2 border-[#16130f] shadow-[2px_2px_0px_#16130f]">
          <div className="flex items-center gap-2">
            <span className="label text-[#16130f]">Block Controls:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => addBlockAfter(blocks.length - 1, "paragraph")}
                className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Paragraph
              </button>
              <button
                type="button"
                onClick={() => addBlockAfter(blocks.length - 1, "heading_2")}
                className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all flex items-center gap-1"
              >
                <Heading2 className="w-3 h-3" /> Heading
              </button>
              <button
                type="button"
                onClick={() => addBlockAfter(blocks.length - 1, "todo")}
                className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all flex items-center gap-1"
              >
                <CheckSquare className="w-3 h-3" /> Checklist
              </button>
              <button
                type="button"
                onClick={() => addBlockAfter(blocks.length - 1, "callout")}
                className="label px-2 py-1 bg-[#f6f3ee] border border-[#16130f] hover:bg-[#16130f] hover:text-white transition-all flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" /> Callout
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyAsMarkdown}
              className="label px-2 py-1 bg-white border border-[#16130f] hover:bg-[#f6f3ee] transition-all flex items-center gap-1"
              title="Copy playbook as Markdown"
            >
              {copied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy MD"}</span>
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f6f3ee] border border-[#16130f]">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#c8102e]" />
                  <span className="label text-[#c8102e]">Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="w-3 h-3 text-green-700" />
                  <span className="label text-[#7c7770]">All Saved</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="label text-[#c8102e] hover:underline flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Save Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Body Canvas */}
      <div className="bg-white border-2 border-[#16130f] shadow-[4px_4px_0px_#16130f] p-6 sm:p-10 min-h-[520px] space-y-3">
        {blocks.map((block, index) => {
          const isFocused = activeBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`group relative flex items-start gap-2 -mx-3 px-3 py-1.5 transition-colors rounded-xs ${
                isFocused ? "bg-[#faf8f5]" : "hover:bg-[#fcfaf7]"
              }`}
            >
              {/* Left Action Handle */}
              {!readOnly && (
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 shrink-0 pt-1 transition-opacity">
                  {/* Block Type Dropdown */}
                  <select
                    value={block.type}
                    onChange={(e) => updateBlockType(block.id, e.target.value as BlockType)}
                    className="label px-1 py-0.5 bg-white border border-[#16130f] text-[10px] text-[#7c7770] hover:text-[#16130f] focus:outline-hidden"
                    title="Change block type"
                  >
                    {BLOCK_TYPES.map((bt) => (
                      <option key={bt.type} value={bt.type}>
                        {bt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => moveBlock(index, "up")}
                    disabled={index === 0}
                    className="p-1 hover:bg-[#ede8df] text-[#7c7770] disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveBlock(index, "down")}
                    disabled={index === blocks.length - 1}
                    className="p-1 hover:bg-[#ede8df] text-[#7c7770] disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBlock(block.id)}
                    className="p-1 hover:bg-[#fbe8eb] text-[#7c7770] hover:text-[#c8102e]"
                    title="Delete block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Block Content Rendering */}
              <div className="flex-1 min-w-0">
                {block.type === "heading_1" && (
                  <input
                    type="text"
                    value={block.text}
                    readOnly={readOnly}
                    onFocus={() => setActiveBlockId(block.id)}
                    onChange={(e) => updateBlockText(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addBlockAfter(index, "paragraph");
                      }
                    }}
                    placeholder="Heading 1..."
                    className="w-full font-display font-black text-2xl sm:text-3xl text-[#16130f] tracking-tight bg-transparent border-none focus:outline-hidden placeholder:text-[#ccc6bc]"
                  />
                )}

                {block.type === "heading_2" && (
                  <input
                    type="text"
                    value={block.text}
                    readOnly={readOnly}
                    onFocus={() => setActiveBlockId(block.id)}
                    onChange={(e) => updateBlockText(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addBlockAfter(index, "paragraph");
                      }
                    }}
                    placeholder="Heading 2..."
                    className="w-full font-display font-bold text-xl text-[#16130f] tracking-tight bg-transparent border-none focus:outline-hidden placeholder:text-[#ccc6bc] mt-2 border-b border-[#ede8df] pb-1"
                  />
                )}

                {block.type === "heading_3" && (
                  <input
                    type="text"
                    value={block.text}
                    readOnly={readOnly}
                    onFocus={() => setActiveBlockId(block.id)}
                    onChange={(e) => updateBlockText(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addBlockAfter(index, "paragraph");
                      }
                    }}
                    placeholder="Heading 3..."
                    className="w-full font-display font-bold text-base text-[#16130f] bg-transparent border-none focus:outline-hidden placeholder:text-[#ccc6bc]"
                  />
                )}

                {block.type === "paragraph" && (
                  <textarea
                    rows={Math.max(1, Math.ceil((block.text.length || 1) / 80))}
                    value={block.text}
                    readOnly={readOnly}
                    onFocus={() => setActiveBlockId(block.id)}
                    onChange={(e) => updateBlockText(block.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addBlockAfter(index, "paragraph");
                      }
                    }}
                    placeholder="Type '/' or start writing..."
                    className="w-full font-sans text-sm text-[#16130f] leading-relaxed bg-transparent border-none focus:outline-hidden resize-none placeholder:text-[#ccc6bc]"
                  />
                )}

                {block.type === "bullet_list" && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 bg-[#c8102e] mt-2 shrink-0 border border-[#16130f]" />
                    <textarea
                      rows={Math.max(1, Math.ceil((block.text.length || 1) / 75))}
                      value={block.text}
                      readOnly={readOnly}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addBlockAfter(index, "bullet_list");
                        }
                      }}
                      placeholder="Bullet point..."
                      className="w-full font-sans text-sm text-[#16130f] leading-relaxed bg-transparent border-none focus:outline-hidden resize-none placeholder:text-[#ccc6bc]"
                    />
                  </div>
                )}

                {block.type === "numbered_list" && (
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs font-bold text-[#c8102e] mt-1 shrink-0">
                      {(index + 1).toString().padStart(2, "0")}.
                    </span>
                    <textarea
                      rows={Math.max(1, Math.ceil((block.text.length || 1) / 75))}
                      value={block.text}
                      readOnly={readOnly}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addBlockAfter(index, "numbered_list");
                        }
                      }}
                      placeholder="Step details..."
                      className="w-full font-sans text-sm text-[#16130f] leading-relaxed bg-transparent border-none focus:outline-hidden resize-none placeholder:text-[#ccc6bc]"
                    />
                  </div>
                )}

                {block.type === "todo" && (
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => !readOnly && toggleTodoCheck(block.id)}
                      className="mt-0.5 text-[#16130f] hover:text-[#c8102e]"
                    >
                      {block.checked ? (
                        <div className="w-4 h-4 bg-[#16130f] text-white text-[10px] font-mono flex items-center justify-center border border-[#16130f]">
                          ✓
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-[#16130f]" />
                      )}
                    </button>
                    <textarea
                      rows={Math.max(1, Math.ceil((block.text.length || 1) / 75))}
                      value={block.text}
                      readOnly={readOnly}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addBlockAfter(index, "todo");
                        }
                      }}
                      placeholder="Checklist task..."
                      className={`w-full font-sans text-sm leading-relaxed bg-transparent border-none focus:outline-hidden resize-none placeholder:text-[#ccc6bc] ${
                        block.checked ? "line-through text-[#7c7770]" : "text-[#16130f]"
                      }`}
                    />
                  </div>
                )}

                {block.type === "callout" && (
                  <div className="p-3 bg-[#f6f3ee] border-2 border-[#16130f] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#c8102e] shrink-0 mt-0.5" />
                    <textarea
                      rows={Math.max(1, Math.ceil((block.text.length || 1) / 70))}
                      value={block.text}
                      readOnly={readOnly}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addBlockAfter(index, "paragraph");
                        }
                      }}
                      placeholder="Operational rule or essential note..."
                      className="w-full font-sans text-xs text-[#16130f] font-medium leading-relaxed bg-transparent border-none focus:outline-hidden resize-none placeholder:text-[#7c7770]"
                    />
                  </div>
                )}

                {block.type === "image" && (
                  <div className="space-y-2 my-2">
                    {block.url ? (
                      <div className="relative inline-block border-2 border-[#16130f] bg-[#16130f] shadow-[3px_3px_0px_#16130f] overflow-hidden max-w-full">
                        <img
                          src={block.url}
                          alt={block.text || "Keyframe visual"}
                          className="max-h-[380px] w-auto object-contain block"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-[#f6f3ee] border-2 border-dashed border-[#16130f] flex items-center justify-center text-xs font-mono text-[#7c7770]">
                        No image URL specified
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={block.text || ""}
                        readOnly={readOnly}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => updateBlockText(block.id, e.target.value)}
                        placeholder="Image caption / description..."
                        className="w-full font-mono text-[11px] text-[#7c7770] bg-transparent border-none focus:outline-hidden placeholder:text-[#ccc6bc]"
                      />
                      {!readOnly && (
                        <input
                          type="text"
                          value={block.url || ""}
                          onChange={(e) => {
                            const newBlocks = blocks.map((b) =>
                              b.id === block.id ? { ...b, url: e.target.value } : b
                            );
                            setBlocks(newBlocks);
                            triggerAutoSave(newBlocks);
                          }}
                          placeholder="Image URL..."
                          className="w-1/2 font-mono text-[10px] text-[#7c7770] px-2 py-1 bg-white border border-[#16130f] focus:outline-hidden"
                        />
                      )}
                    </div>
                  </div>
                )}

                {block.type === "code_snippet" && (
                  <div className="bg-[#16130f] text-[#f6f3ee] p-3 border-2 border-[#16130f] font-mono text-xs">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#332e29]">
                      <span className="text-[10px] text-[#bd9b4e] uppercase tracking-wider font-bold">
                        Template / Message Script
                      </span>
                    </div>
                    <textarea
                      rows={Math.max(2, Math.ceil((block.text.length || 1) / 60))}
                      value={block.text}
                      readOnly={readOnly}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      placeholder="Paste outreach pitch or message script..."
                      className="w-full bg-transparent text-[#f6f3ee] font-mono text-xs leading-relaxed border-none focus:outline-hidden resize-none placeholder:text-[#7c7770]"
                    />
                  </div>
                )}

                {block.type === "divider" && (
                  <div className="py-2">
                    <hr className="border-t-2 border-[#16130f]" />
                  </div>
                )}
              </div>

              {/* Add Block button below when hovering */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => addBlockAfter(index, "paragraph")}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#ede8df] text-[#7c7770] hover:text-[#16130f] transition-opacity shrink-0"
                  title="Add block below"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Bottom add block area */}
        {!readOnly && (
          <div className="pt-4 border-t border-dashed border-[#ede8df]">
            <button
              type="button"
              onClick={() => addBlockAfter(blocks.length - 1, "paragraph")}
              className="label text-[#7c7770] hover:text-[#16130f] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Block to Playbook</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
