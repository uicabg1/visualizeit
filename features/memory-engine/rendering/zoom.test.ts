import { describe, expect, it } from "vitest";

import { clampZoom, maxAreaScale, MAX_ZOOM, MIN_ZOOM, zoomByWheel } from "./zoom";

describe("zoom", () => {
  it("clamps to 0.5–2", () => {
    expect(clampZoom(5)).toBe(MAX_ZOOM);
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(1)).toBe(1);
  });

  it("rounds to one decimal (no float drift)", () => {
    expect(clampZoom(1.05)).toBe(1.1);
    const fromOne = zoomByWheel(zoomByWheel(zoomByWheel(1, 10), 10), 10);
    expect(fromOne).toBe(0.7);
  });

  it("wheel: negative deltaY zooms in, positive zooms out, clamped at limits", () => {
    expect(zoomByWheel(1, -50)).toBe(1.1);
    expect(zoomByWheel(1, 50)).toBe(0.9);
    expect(zoomByWheel(MAX_ZOOM, -50)).toBe(MAX_ZOOM);
    expect(zoomByWheel(MIN_ZOOM, 50)).toBe(MIN_ZOOM);
  });

  it("maxAreaScale caps bitmap scale so w*s × h*s stays under area limit", () => {
    const s = maxAreaScale(1200, 800);
    expect(s * s * 1200 * 800).toBeLessThanOrEqual(16_000_000);
    expect(maxAreaScale(0, 500)).toBe(1);
    expect(maxAreaScale(200, 200)).toBeGreaterThan(4);
  });
});
