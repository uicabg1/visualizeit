import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getPlaybackIntervalMs, type PlaybackSpeed } from "@/features/memory-engine/rendering/playbackSpeed";

export const clampStep = (candidate: number, maxStep: number): number =>
  Math.min(Math.max(candidate, 0), maxStep);

type PlaybackOptions = {
  activeStepIndex: number;
  maxStep: number;
  setStepIndex: Dispatch<SetStateAction<number>>;
};

export function usePlayback({ activeStepIndex, maxStep, setStepIndex }: PlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(0.5);

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
  }, [activeStepIndex, isPlaying, maxStep, playbackSpeed, setStepIndex]);

  return { isPlaying, playbackSpeed, setIsPlaying, setPlaybackSpeed };
}
