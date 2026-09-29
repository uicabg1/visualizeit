"use client";

import Link from "next/link";
import { useState } from "react";

import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { BrandMark } from "@/components/BrandMark";

export function PhoneGate() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="phone-gate" role="main" aria-label="Open on a wider device">
      <div className="phone-gate__bg">
        <BrandMark size={52} className="phone-gate__logo"/>

        <h1 className="phone-gate__headline">
          <span className="phone-gate__line1">Stack frames + pointers</span>
          <span className="phone-gate__line2">need room</span>
        </h1>

        <p className="phone-gate__sub">
          Open on laptop or tablet{" "}
          <em className="phone-gate__accent">≥768px</em>
        </p>

        <p className="phone-gate__label">
          {memoryEngineScenarios.length} scenarios · designed for 768 px and wider
        </p>

        <div className="phone-gate__actions">
          <button
            className="phone-gate__copy-btn"
            onClick={handleCopy}
            type="button"
            aria-live="polite"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                  <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Copy Link
              </>
            )}
          </button>

          <Link href="/about" className="phone-gate__about-link">
            Read the overview
          </Link>
        </div>

        <p className="phone-gate__footer-note">This link keeps your scenario + step</p>
      </div>
    </div>
  );
}
