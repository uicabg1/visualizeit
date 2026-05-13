"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef } from "react";

import type { MemoryScene, MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";
import { drawMemoryScene } from "@/features/memory-engine/rendering/drawMemoryScene";
import { tweenRenderModel } from "@/features/memory-engine/rendering/interpolateScene";
import { hitTestMemoryScene } from "@/features/memory-engine/rendering/layoutMemoryScene";
import { getPlaybackIntervalMs, getTransitionMs, type PlaybackSpeed } from "@/features/memory-engine/rendering/playbackSpeed";

type MemoryCanvasProps = {
  scene: MemoryScene;
  selectedId: string | null;
  onSelect: (selected: MemorySceneSelectable | null) => void;
  stepIndex?: number;
  playbackSpeed?: PlaybackSpeed;
};

export function MemoryCanvas({ scene, selectedId, onSelect, stepIndex, playbackSpeed }: MemoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSceneRef = useRef<MemoryScene | null>(null);
  const prevStepRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = (targetScene: MemoryScene) => {
      const scale = window.devicePixelRatio || 1;
      const displayWidth = targetScene.bounds.width;
      const displayHeight = targetScene.bounds.height;
      canvas.width = Math.round(displayWidth * scale);
      canvas.height = Math.round(displayHeight * scale);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      drawMemoryScene(context, targetScene, { selectedId });
    };

    const prevScene = prevSceneRef.current;
    const sceneChanged = prevScene !== scene;

    // Snap when: first render, reduced-motion, or user jumped multiple steps
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepDelta =
      stepIndex !== undefined && prevStepRef.current !== null
        ? Math.abs(stepIndex - prevStepRef.current)
        : 0;
    const shouldSnap = !sceneChanged || !prevScene || prefersReducedMotion || stepDelta > 1;

    if (shouldSnap) {
      cancelAnimationFrame(rafRef.current);
      paint(scene);
      prevSceneRef.current = scene;
      if (stepIndex !== undefined) prevStepRef.current = stepIndex;
      return;
    }

    // Tween from prevScene → scene over transitionMs
    const speed = playbackSpeed ?? 1;
    const transitionMs = getTransitionMs(speed, getPlaybackIntervalMs(speed));
    const startTime = performance.now();
    const capturedPrev = prevScene;

    cancelAnimationFrame(rafRef.current);

    const animate = (now: number) => {
      const t = Math.min((now - startTime) / transitionMs, 1);
      if (t < 1) {
        const tweened = tweenRenderModel(capturedPrev, scene, t);
        paint({ ...tweened, stackLane: scene.stackLane, heapLane: scene.heapLane, releasedFrames: scene.releasedFrames });
        rafRef.current = requestAnimationFrame(animate);
      } else {
        paint(scene);
        prevSceneRef.current = scene;
        if (stepIndex !== undefined) prevStepRef.current = stepIndex;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scene, selectedId, stepIndex, playbackSpeed]);

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - bounds.left) / bounds.width) * scene.bounds.width,
      y: ((event.clientY - bounds.top) / bounds.height) * scene.bounds.height
    };

    onSelect(hitTestMemoryScene(scene, point));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "Escape") {
      onSelect(null);
    }
  };

  const showOverlay = (stepIndex ?? 0) === 0;

  return (
    <div className="memory-canvas-shell">
      {showOverlay && (
        <div className="memory-canvas-overlay" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#F5B82E"/>
            <path d="M9 9 L16 23 L23 9" stroke="#0B0D10" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth="1"/>
          </svg>
          <p className="memory-canvas-overlay__headline">Step through C memory, live.</p>
          <p className="memory-canvas-overlay__hint">Press Play or use → to advance step by step.</p>
          <div className="memory-canvas-overlay__chips">
            <span className="memory-canvas-overlay__chip"><kbd>Space</kbd> Play</span>
            <span className="memory-canvas-overlay__chip"><kbd>→</kbd> Next step</span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label="Memory canvas"
        className="memory-canvas"
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        role="img"
        tabIndex={0}
      />
    </div>
  );
}
