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

  it("ships four deterministic MVP scenarios with readable labels", () => {
    expect(memoryEngineScenarios).toHaveLength(4);

    for (const scenario of memoryEngineScenarios) {
      const firstRun = runMemoryProgram(scenario.commands);
      const secondRun = runMemoryProgram(scenario.commands);

      expect(firstRun).toEqual(secondRun);
      expect(firstRun).toHaveLength(scenario.commands.length + 1);
      expect(scenario.commands.every((command) => command.label.length > 0)).toBe(true);
    }
  });
});

