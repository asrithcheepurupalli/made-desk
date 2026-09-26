"use client";

import React from "react";
import { Download, Monitor, Smartphone, X, Check, Apple, Sparkles } from "lucide-react";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
}

export function InstallAppModal({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall,
}: InstallAppModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#16130f]/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-white border-3 border-[#16130f] shadow-[6px_6px_0px_#16130f] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b-2 border-[#16130f] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="label text-[#c8102e]">PWA APP INSTALLATION</span>
            </div>
            <h2 className="font-display font-black text-xl text-[#16130f] mt-1">
              Install made<span className="text-[#c8102e]">.</span> desk
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#16130f] bg-[#f6f3ee] hover:bg-[#ede8df]"
          >
            <X className="w-4 h-4 text-[#16130f]" />
          </button>
        </div>

        {/* 1-Click Native Install if available */}
        {canNativeInstall && onNativeInstall && (
          <div className="mb-5 p-4 bg-[#f6f3ee] border-2 border-[#16130f]">
            <p className="font-sans text-xs font-semibold text-[#16130f] mb-3">
              One-click desktop app installation is available in your browser:
            </p>
            <button
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full brutal-btn-red flex items-center justify-center gap-2 text-xs py-2.5"
            >
              <Download className="w-4 h-4" />
              <span>Install to Dock / Applications</span>
            </button>
          </div>
        )}

        {/* Instructions by Platform */}
        <div className="space-y-3 font-mono text-xs text-[#16130f]">
          <div className="p-3 border-2 border-[#16130f] bg-white">
            <div className="flex items-center gap-2 font-bold mb-1.5 text-[#16130f]">
              <Monitor className="w-4 h-4 text-[#c8102e]" />
              <span>macOS Safari / Chrome</span>
            </div>
            <p className="text-[11px] text-[#7c7770] font-sans leading-relaxed">
              • <strong>Safari:</strong> In the top menu, click <strong>File</strong> → <strong>Add to Dock...</strong><br />
              • <strong>Chrome:</strong> Click the <strong>Install</strong> icon on the right side of the address bar.
            </p>
          </div>

          <div className="p-3 border-2 border-[#16130f] bg-white">
            <div className="flex items-center gap-2 font-bold mb-1.5 text-[#16130f]">
              <Smartphone className="w-4 h-4 text-[#c8102e]" />
              <span>iOS / iPhone & iPad</span>
            </div>
            <p className="text-[11px] text-[#7c7770] font-sans leading-relaxed">
              Tap the <strong>Share</strong> button (square with arrow) in Safari, then select <strong>Add to Home Screen</strong>.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t-2 border-[#16130f] flex items-center justify-between text-[11px] font-mono text-[#7c7770]">
          <span>Runs standalone with zero address bar</span>
          <button
            onClick={onClose}
            className="font-bold underline text-[#16130f] hover:text-[#c8102e]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
