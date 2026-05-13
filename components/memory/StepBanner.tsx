"use client";

import type { MemoryEvent } from "@/features/memory-engine/domain/snapshots";

type StepBannerProps = {
  stepIndex: number;
  stepCount: number;
  event: MemoryEvent | null;
};

export function StepBanner({ stepIndex, stepCount, event }: StepBannerProps) {
  const hasEvent = event !== null && event.commandType !== "INITIALIZE";

  if (!hasEvent) {
    return (
      <section className="memory-step-banner" aria-live="polite">
        <span className="memory-step-banner__placeholder">Initial memory state</span>
      </section>
    );
  }

  const safeStepCount = Math.max(stepCount, 1);
  const displayStep = Math.min(stepIndex + 1, safeStepCount);

  return (
    <section className="memory-step-banner" aria-live="polite">
      <span className="memory-step-banner__step">
        Step {displayStep}:
      </span>
      <span className="memory-step-banner__description">{event.label}</span>
    </section>
  );
}
