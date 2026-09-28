"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { explainEvent } from "@/features/memory-engine/pedagogy/explainEvent";
import type { MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";
import { layoutMemoryScene } from "@/features/memory-engine/rendering/layoutMemoryScene";
import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { runMemoryProgram } from "@/features/memory-engine/simulation/memoryEngine";
import { ExplanationPanel, type LearningTab } from "./ExplanationPanel";
import { MemoryCanvas } from "./MemoryCanvas";
import { MemoryControls } from "./MemoryControls";
import { PhoneGate } from "./PhoneGate";
import { ScenarioSidebar } from "./ScenarioSidebar";
import { StepBanner } from "./StepBanner";
import { clampStep, usePlayback } from "./hooks/usePlayback";
import { useMediaViewport } from "./hooks/useMediaViewport";
import { useUrlState, useUrlSync } from "./hooks/useUrlState";

export function MemoryWorkspace() {
  const { initialStep, scenarioId, setScenarioId, stepIndex, setStepIndex } = useUrlState();
  const { canvasAreaRef, containerWidth, isPhone } = useMediaViewport();

  const [overlayState, setOverlayState] = useState<"visible" | "exiting" | "hidden">(
    initialStep === 0 ? "visible" : "hidden"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<LearningTab>("code");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isInitialMountRef = useRef(true);
  const overlayDismissRef = useRef(false);

  const scenario = useMemo(
    () => memoryEngineScenarios.find((candidate) => candidate.id === scenarioId) ?? memoryEngineScenarios[0],
    [scenarioId]
  );

  const snapshots = useMemo(() => (scenario ? runMemoryProgram(scenario.commands) : []), [scenario]);
  const maxStep = Math.max(snapshots.length - 1, 0);
  const activeStepIndex = clampStep(stepIndex, maxStep);
  const { isPlaying, playbackSpeed, setIsPlaying, setPlaybackSpeed } = usePlayback({
    activeStepIndex,
    maxStep,
    setStepIndex,
  });
  useUrlSync(scenarioId, activeStepIndex);
  const activeSnapshot = snapshots[activeStepIndex];
  const explanations = activeSnapshot ? explainEvent(activeSnapshot) : [];
  const activeScene = useMemo(
    () => (activeSnapshot ? layoutMemoryScene(activeSnapshot, { regions: scenario?.regions, minWidth: containerWidth }) : null),
    [activeSnapshot, scenario, containerWidth]
  );
  const selected = activeScene?.selectables.find((candidate) => candidate.id === selectedId) ?? null;

  const codeLines = scenario?.codeLines;
  const activeCommandIndex = activeStepIndex - 1;
  const highlightedLine =
    codeLines && scenario?.stepToLine && activeCommandIndex >= 0
      ? scenario.stepToLine[activeCommandIndex]
      : undefined;

  useEffect(() => {
    if (activeStepIndex > 0 && !overlayDismissRef.current && overlayState !== "hidden") {
      overlayDismissRef.current = true;
      setOverlayState("exiting");
      const timer = setTimeout(() => setOverlayState("hidden"), 600);
      return () => {
        clearTimeout(timer);
        overlayDismissRef.current = false;
      };
    }
  // overlayState intentionally omitted — guard via ref prevents double-fire in strict mode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStepIndex]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setStepIndex(0);
    setIsPlaying(false);
    setSelectedId(null);
    setActiveTab("code");
    setIsSidebarOpen(false);
  }, [scenarioId, setIsPlaying, setStepIndex]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((c) => !c);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setStepIndex((c) => clampStep(c + 1, maxStep));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStepIndex((c) => clampStep(c - 1, maxStep));
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsFullscreen((c) => !c);
      } else if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxStep, isFullscreen, setIsPlaying, setStepIndex]);

  const handleStepChange = (nextStep: number) => {
    setStepIndex(clampStep(nextStep, maxStep));
  };

  const handleSelect = (nextSelected: MemorySceneSelectable | null) => {
    setSelectedId(nextSelected?.id ?? null);
    if (nextSelected) {
      setActiveTab("explanation");
    }
  };

  if (!scenario || !activeSnapshot || !activeScene) {
    return (
      <main className="memory-workspace">
        <p className="muted" style={{ padding: "32px" }}>No memory scenarios are available.</p>
      </main>
    );
  }

  if (isPhone) {
    return <PhoneGate />;
  }

  return (
    <main className="memory-workspace">
      <nav className="memory-workspace__navbar" aria-label="VisualizeIT navigation">
        <div className="memory-workspace__navbar-row">
          <div className="memory-workspace__brand">
            <button
              type="button"
              className="memory-workspace__hamburger"
              onClick={() => setIsSidebarOpen((c) => !c)}
              aria-label={isSidebarOpen ? "Close scenario drawer" : "Open scenario drawer"}
              aria-expanded={isSidebarOpen}
              aria-controls="scenario-drawer"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="17" y2="6"/>
                <line x1="3" y1="10" x2="17" y2="10"/>
                <line x1="3" y1="14" x2="17" y2="14"/>
              </svg>
            </button>
            <span className="memory-workspace__logo" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="#F5B82E"/>
                <path d="M9 9 L16 23 L23 9" stroke="#0B0D10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="1"/>
              </svg>
            </span>
            <span className="memory-workspace__brand-name">VisualizeIT</span>
            <span className="memory-workspace__brand-chip">Memory Engine</span>
          </div>

          <div className="memory-workspace__navbar-center">
            <MemoryControls
              isPlaying={isPlaying}
              onNext={() => handleStepChange(activeStepIndex + 1)}
              onPlayToggle={() => setIsPlaying((current) => !current)}
              onPrevious={() => handleStepChange(activeStepIndex - 1)}
              onReset={() => {
                setIsPlaying(false);
                handleStepChange(0);
              }}
              onSpeedChange={setPlaybackSpeed}
              onStepChange={handleStepChange}
              playbackSpeed={playbackSpeed}
              stepCount={snapshots.length}
              stepIndex={activeStepIndex}
            />
          </div>

          <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setIsFullscreen((c) => !c)}
              title={isFullscreen ? "Exit fullscreen (Esc or f)" : "Fullscreen (f)"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 500,
                color: isFullscreen ? "var(--accent-amber)" : "var(--text-secondary)",
                background: isFullscreen ? "var(--accent-amber-dim)" : "none",
                border: `1px solid ${isFullscreen ? "var(--accent-amber-border)" : "var(--border-default)"}`,
                borderRadius: "var(--radius-md)",
                padding: "4px 10px",
                cursor: "pointer",
                transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
              }}
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 500,
                color: copied ? "var(--color-pointer)" : "var(--text-secondary)",
                background: "none",
                border: `1px solid ${copied ? "var(--color-pointer)" : "var(--border-default)"}`,
                borderRadius: "var(--radius-md)",
                padding: "4px 10px",
                cursor: "pointer",
                transition: "color 150ms ease, border-color 150ms ease",
                opacity: copied ? 1 : undefined,
              }}
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
            <Link
              href="/about"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "4px 10px",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                transition: "color 150ms ease, border-color 150ms ease"
              }}
            >
              About
            </Link>
          </div>
        </div>

        <div className="memory-workspace__navbar-meta" aria-live="polite">
          <span className="memory-workspace__tagline">Real-time visual simulation for dense technical concepts</span>
          <span className="memory-workspace__meta-divider" aria-hidden="true">·</span>
          <span className="memory-workspace__scenario-title">{scenario.title}</span>
          <span className="memory-workspace__meta-divider" aria-hidden="true">—</span>
          <span className="memory-workspace__scenario-summary">{scenario.description}</span>
        </div>
      </nav>

      <div className={`memory-workspace__main${isSidebarOpen ? " is-drawer-open" : ""}${isFullscreen ? " is-fullscreen" : ""}`}>
        <div
          className="memory-workspace__sidebar-slot"
          id="scenario-drawer"
          role={isSidebarOpen ? "dialog" : undefined}
          aria-label="Scenarios"
        >
          <ScenarioSidebar
            scenarios={memoryEngineScenarios}
            selectedScenarioId={scenarioId}
            onScenarioChange={setScenarioId}
          />
        </div>
        <button
          type="button"
          className="memory-workspace__backdrop"
          aria-label="Close scenario drawer"
          onClick={() => setIsSidebarOpen(false)}
          tabIndex={isSidebarOpen ? 0 : -1}
        />
        <div className="memory-workspace__canvas-area" ref={canvasAreaRef}>
          <MemoryCanvas
            onSelect={handleSelect}
            playbackSpeed={playbackSpeed}
            scene={activeScene}
            selectedId={selectedId}
            stepIndex={activeStepIndex}
          />
          <StepBanner
            event={activeSnapshot.event}
            stepCount={snapshots.length}
            stepIndex={activeStepIndex}
          />
        </div>

        <ExplanationPanel
          activeTab={activeTab}
          codeLines={codeLines}
          explanations={explanations}
          highlightedLine={highlightedLine}
          onTabChange={setActiveTab}
          scenarioCommands={scenario.commands}
          selected={selected}
          snapshot={activeSnapshot}
        />
      </div>

      {overlayState !== "hidden" && renderWelcomeOverlay(
        overlayState === "exiting",
        () => {
          if (overlayState === "visible") {
            setStepIndex((c) => clampStep(c + 1, maxStep));
          }
        }
      )}
    </main>
  );
}

function overlayBg() {
  return (
    <div className="welcome-overlay__bg">
      <svg viewBox="0 0 32 32" width="60" height="60" className="welcome-overlay__logo" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#F5B82E"/>
        <path d="M9 9 L16 23 L23 9" stroke="#0B0D10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="1"/>
      </svg>
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

function renderWelcomeOverlay(isExiting: boolean, onTap: () => void) {
  return (
    <div
      className={`welcome-overlay${isExiting ? " is-exiting" : ""}`}
      onClick={onTap}
      role="button"
      aria-label="Tap to start"
      tabIndex={-1}
    >
      <div className="welcome-overlay__panel welcome-overlay__panel--top">{overlayBg()}</div>
      <div className="welcome-overlay__panel welcome-overlay__panel--bottom">{overlayBg()}</div>
    </div>
  );
}
