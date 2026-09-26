import React from "react";
import Link from "next/link";

interface WordmarkProps {
  word?: string;
  className?: string;
  sub?: string;
  href?: string;
}

export function Wordmark({
  word = "made",
  sub = "desk",
  className = "",
  href,
}: WordmarkProps) {
  const content = (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="font-display font-semibold italic tracking-tight text-[#16130f]">
        {word}
        <span className="not-italic text-[#c8102e]">.</span>
      </span>
      {sub && (
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#7c7770] px-1.5 py-0.2 border border-[#16130f] bg-[#f6f3ee]">
          {sub}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
