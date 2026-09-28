"use client";

import Link from "next/link";
import { useState } from "react";

type WorkspaceToolbarProps = {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function WorkspaceToolbar({ isFullscreen, onToggleFullscreen }: WorkspaceToolbarProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="memory-workspace__toolbar">
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Exit fullscreen (Esc or f)" : "Fullscreen (f)"}
        className={`memory-workspace__toolbar-btn${isFullscreen ? " is-active" : ""}`}
        aria-pressed={isFullscreen}
      >
        {isFullscreen ? (
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M5 1H1v4M11 1h4v4M5 15H1v-4M11 15h4v-4"/>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M1 5V1h4M15 5V1h-4M1 11v4h4M15 11v4h-4"/>
          </svg>
        )}
        {isFullscreen ? "Exit" : "Focus"}
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={`memory-workspace__toolbar-btn${copied ? " is-copied" : ""}`}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
              <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
              <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Share
          </>
        )}
      </button>
      <Link href="/about" className="memory-workspace__toolbar-link">
        About
      </Link>
    </div>
  );
}
