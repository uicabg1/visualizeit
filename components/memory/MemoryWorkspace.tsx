"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { explainEvent } from "@/features/memory-engine/pedagogy/explainEvent";
import type { MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";
import { layoutMemoryScene } from "@/features/memory-engine/rendering/layoutMemoryScene";
import { clampZoom, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/features/memory-engine/rendering/zoom";
import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { runMemoryProgram } from "@/features/memory-engine/simulation/memoryEngine";
import { ExplanationPanel, type LearningTab } from "./ExplanationPanel";
import { MemoryCanvas } from "./MemoryCanvas";
import { MemoryControls } from "./MemoryControls";
import { PhoneGate } from "./PhoneGate";
import { ScenarioSidebar } from "./ScenarioSidebar";
import { StepBanner } from "./StepBanner";
import { WelcomeOverlay } from "./WelcomeOverlay";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { BrandMark } from "@/components/BrandMark";
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
  const [activeTab, setActiveTab] = useState<LearningTab>("code");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [instantStep, setInstantStep] = useState(false);
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
        if (e.shiftKey) setInstantStep(true);
        setStepIndex((c) => clampStep(c + 1, maxStep));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) setInstantStep(true);
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

  // Shift-step flag lives one commit: child canvas effect consumes it first, then clears.
  useEffect(() => {
    if (instantStep) setInstantStep(false);
  }, [instantStep]);

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
        <p className="muted memory-workspace__empty">No memory scenarios are available.</p>
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
              <BrandMark size={22}/>
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

          <WorkspaceToolbar isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen((c) => !c)} />
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
          <div className="memory-canvas-zoombar">
            <button
              type="button"
              className="memory-canvas-zoombar__btn"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom(clampZoom(zoom - ZOOM_STEP))}
            >
              −
            </button>
            <button
              type="button"
              className="memory-canvas-zoombar__btn"
              aria-label={`Reset zoom (currently ${Math.round(zoom * 100)}%)`}
              onClick={() => setZoom(1)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="memory-canvas-zoombar__btn"
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom(clampZoom(zoom + ZOOM_STEP))}
            >
              +
            </button>
          </div>
          <MemoryCanvas
            instant={instantStep}
            onZoomChange={setZoom}
            onSelect={handleSelect}
            playbackSpeed={playbackSpeed}
            scene={activeScene}
            selectedId={selectedId}
            stepIndex={activeStepIndex}
            zoom={zoom}
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

      {overlayState !== "hidden" && (
        <WelcomeOverlay
          isExiting={overlayState === "exiting"}
          onTap={() => {
            if (overlayState === "visible") {
              setStepIndex((c) => clampStep(c + 1, maxStep));
            }
          }}
        />
      )}
    </main>
  );
}
