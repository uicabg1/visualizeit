import { describe, expect, it } from "vitest";

import { memoryEngineScenarios } from "../simulation/fixtures";
import { runMemoryProgram } from "../simulation/memoryEngine";
import { hitTestMemoryScene, layoutMemoryScene } from "./layoutMemoryScene";

const snapshotsFor = (scenarioId: string) => {
  const scenario = memoryEngineScenarios.find((candidate) => candidate.id === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  return runMemoryProgram(scenario.commands);
};

const lastSnapshot = (snapshots: ReturnType<typeof runMemoryProgram>) => {
  const snapshot = snapshots.at(-1);

  if (!snapshot) {
    throw new Error("Expected at least one snapshot.");
  }

  return snapshot;
};

describe("layoutMemoryScene", () => {
  it("lays out stack variables, heap blocks, and pointer edges from a heap allocation snapshot", () => {
    const snapshots = snapshotsFor("heap-allocation");
    const scene = layoutMemoryScene(snapshots[3]);

    expect(scene.bounds).toMatchObject({ width: 960, height: 520 });
    expect(scene.stackFrames).toHaveLength(1);
    expect(scene.stackFrames[0]?.variables[0]).toMatchObject({
      id: "stack-variable:frame-1-p",
      label: "p",
      valueLabel: "0x1000 (valid)",
      pointerTargetBlockId: "heap-1",
      pointerStatus: "valid"
    });
    expect(scene.heapBlocks[0]).toMatchObject({
      id: "heap-block:heap-1",
      label: "Allocate one int on the heap",
      address: "0x1000",
      allocated: true
    });
    expect(scene.pointerEdges).toHaveLength(1);
    expect(scene.pointerEdges[0]).toMatchObject({
      sourceId: "stack-variable:frame-1-p",
      targetId: "heap-block:heap-1",
      status: "valid"
    });
    expect(scene.pointerEdges[0]?.from.x).toBeLessThan(scene.pointerEdges[0]?.to.x ?? 0);
  });

  it("creates heap field pointer edges for struct fields", () => {
    const snapshots = snapshotsFor("struct-with-pointer");
    const scene = layoutMemoryScene(lastSnapshot(snapshots));

    expect(scene.heapBlocks).toHaveLength(2);
    expect(scene.heapBlocks[0]?.fields.map((field) => field.label)).toEqual(["value", "next"]);
    expect(scene.pointerEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "heap-field:heap-1:next",
          targetId: "heap-block:heap-2",
          status: "valid"
        })
      ])
    );
  });

  it("maps freed heap blocks and diagnostics into selectable badges", () => {
    const snapshots = snapshotsFor("leak-and-dangling-pointer");
    const scene = layoutMemoryScene(lastSnapshot(snapshots));

    expect(scene.heapBlocks.find((block) => block.blockId === "heap-2")).toMatchObject({
      allocated: false,
      freedAtStep: 7
    });
    expect(scene.pointerEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "stack-variable:frame-1-dangling",
          targetId: "heap-block:heap-2",
          status: "dangling"
        })
      ])
    );
    expect(scene.diagnosticBadges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ diagnosticType: "MEMORY_LEAK", targetId: "heap-1" }),
        expect.objectContaining({ diagnosticType: "DOUBLE_FREE", targetId: "heap-2" })
      ])
    );
  });

  it("expands stack to full canvas width and hides heap lane when regions.heap is false", () => {
    const snapshots = snapshotsFor("stack-frame-basics");
    const scene = layoutMemoryScene(snapshots[1], { regions: { heap: false } });

    expect(scene.heapLane).toBeUndefined();
    expect(scene.stackLane).toBeDefined();
    expect((scene.stackLane?.rect.width ?? 0)).toBeGreaterThan(410);
    expect(scene.stackFrames[0]?.rect.width).toBeGreaterThan(360);
    expect(scene.heapBlocks).toHaveLength(0);
  });

  it("hit tests the most specific selectable node", () => {
    const snapshots = snapshotsFor("heap-allocation");
    const scene = layoutMemoryScene(snapshots[3]);
    const variable = scene.stackFrames[0]?.variables[0];

    expect(variable).toBeDefined();
    const hit = hitTestMemoryScene(scene, {
      x: (variable?.rect.x ?? 0) + 4,
      y: (variable?.rect.y ?? 0) + 4
    });

    expect(hit).toMatchObject({
      id: "stack-variable:frame-1-p",
      kind: "stack-variable",
      label: "p"
    });
  });
});
