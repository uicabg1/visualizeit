"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { explainEvent } from "@/features/memory-engine/pedagogy/explainEvent";
import type { MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";
import { layoutMemoryScene } from "@/features/memory-engine/rendering/layoutMemoryScene";
import { getPlaybackIntervalMs, type PlaybackSpeed } from "@/features/memory-engine/rendering/playbackSpeed";
import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { runMemoryProgram } from "@/features/memory-engine/simulation/memoryEngine";
import { ExplanationPanel } from "./ExplanationPanel";
import { MemoryCanvas } from "./MemoryCanvas";
import { MemoryControls } from "./MemoryControls";
import { ScenarioSidebar } from "./ScenarioSidebar";
import { StepBanner } from "./StepBanner";

const clampStep = (candidate: number, maxStep: number): number =>
  Math.min(Math.max(candidate, 0), maxStep);

export function MemoryWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const firstScenarioId = memoryEngineScenarios[0]?.id ?? "";
  const urlScenarioId = searchParams.get("scenario");
  const urlStep = parseInt(searchParams.get("step") ?? "", 10);
  const initialScenarioId = memoryEngineScenarios.find((s) => s.id === urlScenarioId)?.id ?? firstScenarioId;
  const initialStep = !isNaN(urlStep) && urlStep >= 0 ? urlStep : 0;

  const [scenarioId, setScenarioId] = useState(initialScenarioId);
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [showOverlay, setShowOverlay] = useState(initialStep === 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [containerWidth, setContainerWidth] = useState(960);
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const isInitialMountRef = useRef(true);

  const scenario = useMemo(
    () => memoryEngineScenarios.find((candidate) => candidate.id === scenarioId) ?? memoryEngineScenarios[0],
    [scenarioId]
  );

  const snapshots = useMemo(() => (scenario ? runMemoryProgram(scenario.commands) : []), [scenario]);
  const maxStep = Math.max(snapshots.length - 1, 0);
  const activeStepIndex = clampStep(stepIndex, maxStep);
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
    if (activeStepIndex > 0 && showOverlay) {
      setShowOverlay(false);
    }
  }, [activeStepIndex, showOverlay]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    setStepIndex(0);
    setIsPlaying(false);
    setSelectedId(null);
  }, [scenarioId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ scenario: scenarioId, step: String(activeStepIndex) });
      router.replace(`/?${params.toString()}`);
    }, 150);
    return () => clearTimeout(timer);
  }, [scenarioId, activeStepIndex, router]);

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setContainerWidth(Math.round(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxStep]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    if (activeStepIndex >= maxStep) {
      setIsPlaying(false);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((currentStep) => clampStep(currentStep + 1, maxStep));
    }, getPlaybackIntervalMs(playbackSpeed));

    return () => window.clearInterval(interval);
  }, [activeStepIndex, isPlaying, maxStep, playbackSpeed]);

  const handleStepChange = (nextStep: number) => {
    setStepIndex(clampStep(nextStep, maxStep));
  };

  const handleSelect = (nextSelected: MemorySceneSelectable | null) => {
    setSelectedId(nextSelected?.id ?? null);
  };

  if (!scenario || !activeSnapshot || !activeScene) {
    return (
      <main className="memory-workspace">
        <p className="muted" style={{ padding: "32px" }}>No memory scenarios are available.</p>
      </main>
    );
  }

  return (
    <main className="memory-workspace">
      <nav className="memory-workspace__navbar" aria-label="VisualizeIT navigation">
        <div className="memory-workspace__navbar-row">
          <div className="memory-workspace__brand">
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

          <div style={{ justifySelf: "end" }}>
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

      <div className="memory-workspace__main">
        <ScenarioSidebar
          scenarios={memoryEngineScenarios}
          selectedScenarioId={scenarioId}
          onScenarioChange={setScenarioId}
        />
        <div className="memory-workspace__canvas-area" ref={canvasAreaRef}>
          <MemoryCanvas
            onSelect={handleSelect}
            playbackSpeed={playbackSpeed}
            scene={activeScene}
            selectedId={selectedId}
            showOverlay={showOverlay}
            stepIndex={activeStepIndex}
          />
          <StepBanner
            event={activeSnapshot.event}
            stepCount={snapshots.length}
            stepIndex={activeStepIndex}
          />
        </div>

        <ExplanationPanel
          codeLines={codeLines}
          explanations={explanations}
          highlightedLine={highlightedLine}
          scenarioCommands={scenario.commands}
          selected={selected}
          snapshot={activeSnapshot}
        />
      </div>
    </main>
  );
}
