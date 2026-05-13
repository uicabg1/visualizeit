import { describe, expect, it } from "vitest";

import type { MemoryCommand } from "../domain/commands";
import type { DiagnosticType } from "../domain/diagnostics";
import { getFinalSnapshot, runMemoryProgram } from "./memoryEngine";
import { memoryEngineScenarios } from "./fixtures";

const diagnosticTypes = (commands: MemoryCommand[]): DiagnosticType[] =>
  getFinalSnapshot(runMemoryProgram(commands)).diagnostics.map((diagnostic) => diagnostic.type);

describe("memory engine simulation", () => {
  it("creates and removes stack frames deterministically", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main" },
      {
        type: "DECLARE_VARIABLE",
        name: "counter",
        dataType: "int",
        initialValue: { kind: "number", value: 42 }
      },
      { type: "EXIT_FUNCTION" }
    ];

    const firstRun = runMemoryProgram(commands);
    const secondRun = runMemoryProgram(commands);

    expect(firstRun).toEqual(secondRun);
    expect(firstRun).toHaveLength(commands.length + 1);
    expect(firstRun[1]?.stackFrames[0]?.functionName).toBe("main");
    expect(firstRun[2]?.stackFrames[0]?.variables[0]).toMatchObject({
      name: "counter",
      dataType: "int",
      value: { kind: "number", value: 42 }
    });
    expect(getFinalSnapshot(firstRun).stackFrames).toHaveLength(0);
  });

  it("allocates heap memory, points to it, writes fields, and frees it", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main" },
      { type: "DECLARE_VARIABLE", name: "node", dataType: "struct Node *" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "node" },
        size: 16,
        label: "struct Node",
        fields: [
          { name: "value", dataType: "int", value: { kind: "number", value: 0 } },
          { name: "next", dataType: "struct Node *", value: { kind: "pointer", targetBlockId: null } }
        ]
      },
      {
        type: "WRITE_FIELD",
        blockId: "heap-1",
        fieldName: "value",
        value: { kind: "number", value: 7 }
      },
      { type: "FREE", pointer: { kind: "variable", name: "node" } }
    ];

    const snapshots = runMemoryProgram(commands);
    const allocatedSnapshot = snapshots[3];
    const finalSnapshot = getFinalSnapshot(snapshots);

    expect(allocatedSnapshot?.heapBlocks[0]).toMatchObject({
      id: "heap-1",
      address: "0x1000",
      allocated: true,
      label: "struct Node"
    });
    expect(allocatedSnapshot?.stackFrames[0]?.variables[0]?.value).toMatchObject({
      kind: "pointer",
      targetBlockId: "heap-1",
      address: "0x1000",
      status: "valid"
    });
    expect(snapshots[4]?.heapBlocks[0]?.fields[0]?.value).toEqual({ kind: "number", value: 7 });
    expect(finalSnapshot.heapBlocks[0]?.allocated).toBe(false);
    expect(finalSnapshot.diagnostics.map((diagnostic) => diagnostic.type)).toContain("DANGLING_POINTER");
  });

  it("detects leak, dangling pointer, double free, null dereference, use after free, and fragmentation", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main" },
      { type: "DECLARE_VARIABLE", name: "a", dataType: "int *" },
      { type: "DECLARE_VARIABLE", name: "b", dataType: "int *" },
      { type: "DECLARE_VARIABLE", name: "missing", dataType: "int *" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "a" },
        size: 4,
        label: "int"
      },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "b" },
        size: 4,
        label: "int"
      },
      { type: "ASSIGN_POINTER", target: { kind: "variable", name: "a" }, source: { kind: "null" } },
      { type: "READ_VALUE", source: { kind: "variable", name: "missing" } },
      { type: "FREE", pointer: { kind: "variable", name: "b" } },
      { type: "READ_VALUE", source: { kind: "variable", name: "b" } },
      { type: "FREE", pointer: { kind: "variable", name: "b" } }
    ];

    expect(diagnosticTypes(commands)).toEqual(
      expect.arrayContaining([
        "MEMORY_LEAK",
        "DANGLING_POINTER",
        "DOUBLE_FREE",
        "NULL_POINTER_DEREFERENCE",
        "USE_AFTER_FREE",
        "HEAP_FRAGMENTATION"
      ])
    );
  });

  it("emits releasedFrames in EXIT_FUNCTION snapshot with last-known locals", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main" },
      {
        type: "DECLARE_VARIABLE",
        name: "x",
        dataType: "int",
        initialValue: { kind: "number", value: 1 }
      },
      { type: "EXIT_FUNCTION" }
    ];

    const snapshots = runMemoryProgram(commands);

    expect(snapshots[2]?.releasedFrames).toHaveLength(0);
    expect(snapshots[3]?.releasedFrames).toHaveLength(1);
    expect(snapshots[3]?.releasedFrames[0]).toMatchObject({
      functionName: "main",
      variables: [{ name: "x", dataType: "int" }]
    });
  });

  it("ships seven deterministic MVP scenarios with readable labels", () => {
    expect(memoryEngineScenarios).toHaveLength(7);

    for (const scenario of memoryEngineScenarios) {
      const firstRun = runMemoryProgram(scenario.commands);
      const secondRun = runMemoryProgram(scenario.commands);

      expect(firstRun).toEqual(secondRun);
      expect(firstRun).toHaveLength(scenario.commands.length + 1);
      expect(scenario.commands.every((command) => command.label.length > 0)).toBe(true);
    }
  });

  it("pointer-arithmetic: heap block has 3 written fields after writes, freed at end", () => {
    const scenario = memoryEngineScenarios.find((s) => s.id === "pointer-arithmetic");
    if (!scenario) throw new Error("pointer-arithmetic scenario not found");

    const snapshots = runMemoryProgram(scenario.commands);

    // snapshot[6] = after WRITE arr[2]=30 (initial + 6 commands)
    const afterWritesSnapshot = snapshots[6];
    expect(afterWritesSnapshot?.heapBlocks[0]).toMatchObject({
      id: "heap-1",
      allocated: true,
      label: "int[3]"
    });
    expect(afterWritesSnapshot?.heapBlocks[0]?.fields[0]?.value).toEqual({ kind: "number", value: 10 });
    expect(afterWritesSnapshot?.heapBlocks[0]?.fields[1]?.value).toEqual({ kind: "number", value: 20 });
    expect(afterWritesSnapshot?.heapBlocks[0]?.fields[2]?.value).toEqual({ kind: "number", value: 30 });

    const final = getFinalSnapshot(snapshots);
    expect(final.heapBlocks[0]?.allocated).toBe(false);
  });

  it("linked-list-traversal: two nodes allocated with correct field values, pointer chain connected, both freed at end", () => {
    const scenario = memoryEngineScenarios.find((s) => s.id === "linked-list-traversal");
    if (!scenario) throw new Error("linked-list-traversal scenario not found");

    const snapshots = runMemoryProgram(scenario.commands);

    // snapshot[4] = after MALLOC head — heap-1 exists with value=1, next=null
    const afterHeadMalloc = snapshots[4];
    expect(afterHeadMalloc?.heapBlocks[0]).toMatchObject({ id: "heap-1", allocated: true, label: "struct Node" });
    expect(afterHeadMalloc?.heapBlocks[0]?.fields[0]?.value).toEqual({ kind: "number", value: 1 });

    // snapshot[5] = after MALLOC curr — heap-2 exists with value=2, next=null
    const afterCurrMalloc = snapshots[5];
    expect(afterCurrMalloc?.heapBlocks[1]).toMatchObject({ id: "heap-2", allocated: true, label: "struct Node" });
    expect(afterCurrMalloc?.heapBlocks[1]?.fields[0]?.value).toEqual({ kind: "number", value: 2 });

    // snapshot[6] = after ASSIGN_POINTER head->next = curr — pointer chain established
    const afterLink = snapshots[6];
    const headNextField = afterLink?.heapBlocks[0]?.fields.find((f) => f.name === "next");
    expect(headNextField?.value).toMatchObject({ kind: "pointer", targetBlockId: "heap-2" });

    // both nodes freed at end
    const final = getFinalSnapshot(snapshots);
    expect(final.heapBlocks[0]?.allocated).toBe(false);
    expect(final.heapBlocks[1]?.allocated).toBe(false);
    expect(final.stackFrames).toHaveLength(0);
  });

  it("recursive-stack: peak frame count = 4, final frame count = 0, no diagnostics", () => {
    const scenario = memoryEngineScenarios.find((s) => s.id === "recursive-stack");
    if (!scenario) throw new Error("recursive-stack scenario not found");

    const snapshots = runMemoryProgram(scenario.commands);

    const peakFrameCount = Math.max(...snapshots.map((s) => s.stackFrames.length));
    expect(peakFrameCount).toBe(4);

    const final = getFinalSnapshot(snapshots);
    expect(final.stackFrames).toHaveLength(0);
    expect(final.diagnostics).toHaveLength(0);
  });
});

