import { describe, expect, it } from "vitest";

import { getPlaybackIntervalMs, getTransitionMs, playbackSpeedOptions } from "./playbackSpeed";

describe("playbackSpeed", () => {
  it("exposes beginner-friendly speed choices", () => {
    expect(playbackSpeedOptions.map((option) => option.label)).toEqual(["0.5x", "1x", "1.5x", "2x"]);
  });

  it("maps playback speed to shorter intervals as speed increases", () => {
    expect(getPlaybackIntervalMs(0.5)).toBe(1400);
    expect(getPlaybackIntervalMs(1)).toBe(900);
    expect(getPlaybackIntervalMs(2)).toBe(450);
  });
});

describe("getTransitionMs", () => {
  it("at 1x returns 200ms (base duration)", () => {
    expect(getTransitionMs(1, getPlaybackIntervalMs(1))).toBe(200);
  });

  it("at 2x returns 100ms (halved for faster playback)", () => {
    expect(getTransitionMs(2, getPlaybackIntervalMs(2))).toBe(100);
  });

  it("at 0.5x caps at 60% of interval to avoid overlap", () => {
    const interval = getPlaybackIntervalMs(0.5);
    expect(getTransitionMs(0.5, interval)).toBe(Math.min(400, Math.round(interval * 0.6)));
  });

  it("transition is always strictly less than the auto-play interval", () => {
    for (const speed of [0.5, 1, 1.5, 2] as const) {
      const interval = getPlaybackIntervalMs(speed);
      expect(getTransitionMs(speed, interval)).toBeLessThan(interval);
    }
  });
});
