"use client";

import { playbackSpeedOptions, type PlaybackSpeed } from "@/features/memory-engine/rendering/playbackSpeed";

type MemoryControlsProps = {
  stepIndex: number;
  stepCount: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlayToggle: () => void;
  onStepChange: (nextStep: number) => void;
};

function IconReset() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconSkipBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function IconSkipForward() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

export function MemoryControls({
  stepIndex,
  stepCount,
  isPlaying,
  playbackSpeed,
  onSpeedChange,
  onReset,
  onPrevious,
  onNext,
  onPlayToggle,
  onStepChange
}: MemoryControlsProps) {
  const totalSteps = Math.max(stepCount, 1);
  const maxStep = Math.max(stepCount - 1, 0);
  const isAtStart = stepIndex === 0;
  const isAtEnd = stepIndex >= maxStep;

  return (
    <div className="memory-controls" role="group" aria-label="Memory controls">
      <div className="memory-controls__buttons" aria-label="Playback controls">
        <button
          type="button"
          className="memory-controls__btn-icon"
          onClick={onReset}
          aria-label="Reset timeline"
          title="Reset"
        >
          <IconReset />
        </button>
        <button
          type="button"
          className="memory-controls__btn-icon"
          onClick={onPrevious}
          disabled={isAtStart}
          aria-label="Step backward"
          title="Step backward"
        >
          <IconSkipBack />
        </button>
        <button
          type="button"
          className="memory-controls__btn-icon memory-controls__btn-play"
          onClick={onPlayToggle}
          disabled={isAtEnd}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          className="memory-controls__btn-icon"
          onClick={onNext}
          disabled={isAtEnd}
          aria-label="Step forward"
          title="Step forward"
        >
          <IconSkipForward />
        </button>
      </div>

      <input
        type="range"
        className="memory-controls__progress"
        min={0}
        max={maxStep}
        step={1}
        value={stepIndex}
        onChange={(event) => onStepChange(Number(event.target.value))}
        aria-label="Playback progress"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={stepIndex + 1}
        style={{ "--fill-pct": `${maxStep > 0 ? (stepIndex / maxStep) * 100 : 0}%` } as React.CSSProperties}
      />

      <p className="memory-controls__step" aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}>
        {stepIndex + 1} / {totalSteps}
      </p>

      <label className="memory-controls__speed">
        <span className="memory-controls__label">Speed</span>
        <select
          value={playbackSpeed}
          onChange={(event) => onSpeedChange(Number(event.target.value) as PlaybackSpeed)}
        >
          {playbackSpeedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
