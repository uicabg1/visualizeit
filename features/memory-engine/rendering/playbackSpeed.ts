export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type PlaybackSpeedOption = {
  label: string;
  value: PlaybackSpeed;
};

export const playbackSpeedOptions: PlaybackSpeedOption[] = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 }
];

export const getPlaybackIntervalMs = (speed: PlaybackSpeed): number => {
  const intervals: Record<PlaybackSpeed, number> = {
    0.5: 1400,
    1: 900,
    1.5: 650,
    2: 450
  };

  return intervals[speed];
};

// transitionMs must be < intervalMs to prevent overlapping tweens during auto-play
export const getTransitionMs = (speed: PlaybackSpeed, intervalMs: number): number =>
  Math.min(Math.round(200 / speed), Math.round(intervalMs * 0.6));
