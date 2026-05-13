import { describe, expect, it } from "vitest";

import type { MemoryScene, StackFrameNode } from "./canvasTypes";
import { easeInOutCubic, tweenRenderModel } from "./interpolateScene";

const makeRect = (x: number, y: number, w = 360, h = 80) => ({ x, y, width: w, height: h });

const makeFrame = (frameId: string, y: number): StackFrameNode => ({
  id: `stack-frame:${frameId}`,
  frameId,
  label: frameId,
  rect: makeRect(48, y),
  headerRect: makeRect(48, y, 360, 36),
  variables: [],
});

const makeScene = (frames: StackFrameNode[]): MemoryScene => ({
  bounds: { width: 960, height: 520 },
  stackFrames: frames,
  heapBlocks: [],
  pointerEdges: [],
  diagnosticBadges: [],
  selectables: [],
});

describe("easeInOutCubic", () => {
  it("returns 0 at t=0 and 1 at t=1", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it("returns 0.5 at t=0.5 (symmetric midpoint)", () => {
    expect(easeInOutCubic(0.5)).toBe(0.5);
  });

  it("is monotonically increasing", () => {
    const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(easeInOutCubic);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("tweenRenderModel", () => {
  const frameA = makeFrame("main", 56);
  const frameB = makeFrame("main", 120);

  it("at t=0 persisting frame is at prev position", () => {
    const prev = makeScene([frameA]);
    const next = makeScene([frameB]);
    const tween = tweenRenderModel(prev, next, 0);
    expect(tween.stackFrames[0].rect.y).toBe(56);
  });

  it("at t=1 persisting frame is at next position", () => {
    const prev = makeScene([frameA]);
    const next = makeScene([frameB]);
    const tween = tweenRenderModel(prev, next, 1);
    expect(tween.stackFrames[0].rect.y).toBe(120);
  });

  it("at t=0.5 persisting frame is at midpoint (eased 0.5 = linear 0.5)", () => {
    const prev = makeScene([frameA]);
    const next = makeScene([frameB]);
    const tween = tweenRenderModel(prev, next, 0.5);
    expect(tween.stackFrames[0].rect.y).toBe(88);
  });

  it("entering frame fades in (opacity=t at t=0.5)", () => {
    const prev = makeScene([]);
    const next = makeScene([frameA]);
    const tween = tweenRenderModel(prev, next, 0.5);
    expect(tween.stackFrames).toHaveLength(1);
    expect(tween.stackFrames[0].opacity).toBe(easeInOutCubic(0.5));
  });

  it("exiting frame fades out (opacity=1-t at t=0.5)", () => {
    const prev = makeScene([frameA]);
    const next = makeScene([]);
    const tween = tweenRenderModel(prev, next, 0.5);
    expect(tween.stackFrames).toHaveLength(1);
    expect(tween.stackFrames[0].opacity).toBeCloseTo(1 - easeInOutCubic(0.5));
  });

  it("at t=0 entering frame is fully transparent", () => {
    const prev = makeScene([]);
    const next = makeScene([frameA]);
    const tween = tweenRenderModel(prev, next, 0);
    expect(tween.stackFrames[0].opacity).toBe(0);
  });

  it("at t=1 exiting frame is fully transparent", () => {
    const prev = makeScene([frameA]);
    const next = makeScene([]);
    const tween = tweenRenderModel(prev, next, 1);
    expect(tween.stackFrames[0].opacity).toBe(0);
  });

  it("uses next.bounds for tween scene dimensions", () => {
    const prev = makeScene([frameA]);
    const next = { ...makeScene([frameB]), bounds: { width: 960, height: 640 } };
    const tween = tweenRenderModel(prev, next, 0.5);
    expect(tween.bounds).toEqual({ width: 960, height: 640 });
  });
});
