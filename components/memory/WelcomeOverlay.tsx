"use client";

import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { BrandMark } from "@/components/BrandMark";

function OverlayBg() {
  return (
    <div className="welcome-overlay__bg">
      <BrandMark size={60} className="welcome-overlay__logo"/>
      <h1 className="welcome-overlay__headline">
        <span className="welcome-overlay__line1">Step through</span>
        <span className="welcome-overlay__line2"><em className="welcome-overlay__accent">C</em> memory, live.</span>
      </h1>
      <p className="welcome-overlay__sub">{memoryEngineScenarios.length} scenarios · Stack · Heap · Pointers</p>
      <div className="welcome-overlay__chips">
        <span className="welcome-overlay__chip welcome-overlay__chip--kb"><kbd>Space</kbd> Play</span>
        <span className="welcome-overlay__chip welcome-overlay__chip--kb"><kbd>→</kbd> Next step</span>
        <span className="welcome-overlay__chip welcome-overlay__chip--touch">Tap anywhere to start</span>
      </div>
    </div>
  );
}

type WelcomeOverlayProps = {
  isExiting: boolean;
  onTap: () => void;
};

export function WelcomeOverlay({ isExiting, onTap }: WelcomeOverlayProps) {
  return (
    <div
      className={`welcome-overlay${isExiting ? " is-exiting" : ""}`}
      onClick={onTap}
      role="button"
      aria-label="Tap to start"
      tabIndex={-1}
    >
      <div className="welcome-overlay__panel welcome-overlay__panel--top"><OverlayBg /></div>
      <div className="welcome-overlay__panel welcome-overlay__panel--bottom"><OverlayBg /></div>
    </div>
  );
}
