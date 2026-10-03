"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef } from "react";

import type { MemoryScene, MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";
import { drawMemoryScene } from "@/features/memory-engine/rendering/drawMemoryScene";
import { tweenRenderModel } from "@/features/memory-engine/rendering/interpolateScene";
import { hitTestMemoryScene } from "@/features/memory-engine/rendering/layoutMemoryScene";
import { getPlaybackIntervalMs, getTransitionMs, type PlaybackSpeed } from "@/features/memory-engine/rendering/playbackSpeed";
import { maxAreaScale, zoomByWheel } from "@/features/memory-engine/rendering/zoom";

type MemoryCanvasProps = {
  scene: MemoryScene;
  selectedId: string | null;
  onSelect: (selected: MemorySceneSelectable | null) => void;
  stepIndex?: number;
  playbackSpeed?: PlaybackSpeed;
  zoom?: number;
  onZoomChange?: (next: number) => void;
};

export function MemoryCanvas({ scene, selectedId, onSelect, stepIndex, playbackSpeed, zoom = 1, onZoomChange }: MemoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSceneRef = useRef<MemoryScene | null>(null);
  const prevStepRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const zoomRef = useRef(zoom);
  const idlePaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = (targetScene: MemoryScene) => {
      const zoomLevel = zoomRef.current;
      const displayWidth = targetScene.bounds.width;
      const displayHeight = targetScene.bounds.height;
      const scale = Math.min((window.devicePixelRatio || 1) * zoomLevel, Math.max(1, maxAreaScale(displayWidth, displayHeight)));
      canvas.width = Math.round(displayWidth * scale);
      canvas.height = Math.round(displayHeight * scale);
      canvas.style.width = `${displayWidth * zoomLevel}px`;
      canvas.style.height = `${displayHeight * zoomLevel}px`;
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
      idlePaintRef.current = () => paint(scene);
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
        paint(tweened);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        paint(scene);
        idlePaintRef.current = () => paint(scene);
        prevSceneRef.current = scene;
        if (stepIndex !== undefined) prevStepRef.current = stepIndex;
      }
    };

    idlePaintRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scene, selectedId, stepIndex, playbackSpeed]);

  useEffect(() => {
    zoomRef.current = zoom;
    // Idle repaint only; mid-tween the next rAF frame reads zoomRef.current itself.
    idlePaintRef.current?.();
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onZoomChange) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const next = zoomByWheel(zoomRef.current, event.deltaY);
      zoomRef.current = next;
      onZoomChange(next);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [onZoomChange]);

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

  const handleDoubleClick = () => {
    onZoomChange?.(1);
  };

  return (
    <div className="memory-canvas-shell">
      <div className="memory-canvas-viewport">
        <canvas
          ref={canvasRef}
          aria-label="Memory canvas — Ctrl/Cmd+scroll to zoom, double-click to reset"
          className="memory-canvas"
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          role="img"
          tabIndex={0}
        />
      </div>
    </div>
  );
}
