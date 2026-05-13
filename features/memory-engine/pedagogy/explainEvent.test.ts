import { describe, expect, it } from "vitest";

import type { MemoryCommand } from "../domain/commands";
import { getFinalSnapshot, runMemoryProgram } from "../simulation/memoryEngine";
import { explainEvent } from "./explainEvent";

const snapshotAt = (commands: MemoryCommand[], index: number) => {
  const snapshots = runMemoryProgram(commands);
  const snap = snapshots[index];
  if (!snap) throw new Error(`No snapshot at index ${index}`);
  return snap;
};

describe("explainEvent", () => {
  it("explains allocation and free events deterministically", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int" }
    ];

    const snapshots = runMemoryProgram(commands);
    const allocationSnapshot = snapshots[3];

    if (!allocationSnapshot) {
      throw new Error("Expected allocation snapshot at step 3.");
    }

    expect(explainEvent(allocationSnapshot)).toContain("malloc reserves 4 bytes on the heap.");
    expect(explainEvent(getFinalSnapshot(snapshots))).toContain("free releases the heap block referenced by p.");
  });

  it("explains ENTER_FUNCTION", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" }
    ];
    const result = explainEvent(snapshotAt(commands, 1));
    expect(result).toContain("Stack frame for main pushed. Locals will live until the function returns.");
  });

  it("explains EXIT_FUNCTION", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "helper", label: "Enter helper" },
      { type: "EXIT_FUNCTION", label: "Exit helper" }
    ];
    const result = explainEvent(snapshotAt(commands, 2));
    expect(result).toContain("Stack frame popped. Locals released; pointers into this frame become invalid.");
  });

  it("explains DECLARE_VARIABLE for non-pointer", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "x", dataType: "int", label: "Declare x" }
    ];
    const result = explainEvent(snapshotAt(commands, 2));
    expect(result).toContain("Local x reserved on the active stack frame.");
  });

  it("explains DECLARE_VARIABLE for pointer type", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" }
    ];
    const result = explainEvent(snapshotAt(commands, 2));
    expect(result).toContain("Pointer p reserved; currently null until assigned.");
  });

  it("explains WRITE_FIELD", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "Node *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 8,
        label: "Allocate Node",
        fields: [{ name: "val", dataType: "int", value: 0 }]
      },
      { type: "WRITE_FIELD", blockId: "heap-1", fieldName: "val", value: { kind: "number", value: 42 }, label: "Write val" }
    ];
    const result = explainEvent(snapshotAt(commands, 4));
    expect(result).toContain("Field val written to heap block.");
  });

  it("explains WRITE_ARRAY_INDEX", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "arr", dataType: "int *", label: "Declare arr" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "arr" },
        size: 12,
        label: "Allocate array"
      },
      { type: "WRITE_ARRAY_INDEX", blockId: "heap-1", index: 0, value: { kind: "number", value: 1 }, label: "Write arr[0]" }
    ];
    const result = explainEvent(snapshotAt(commands, 4));
    expect(result).toContain("Array element [0] written to heap block.");
  });

  it("explains ASSIGN_POINTER", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "DECLARE_VARIABLE", name: "q", dataType: "int *", label: "Declare q" },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "q" },
        source: { kind: "target", target: { kind: "variable", name: "p" } },
        label: "Assign q = p"
      }
    ];
    const result = explainEvent(snapshotAt(commands, 5));
    expect(result).toContain("q now references p.");
  });

  it("explains READ_VALUE", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "x", dataType: "int", label: "Declare x" },
      { type: "READ_VALUE", source: { kind: "variable", name: "x" }, label: "Read x" }
    ];
    const result = explainEvent(snapshotAt(commands, 3));
    expect(result).toContain("Reading value through x.");
  });

  it("explains memory diagnostics", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int" },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int again" }
    ];

    const explanation = explainEvent(getFinalSnapshot(runMemoryProgram(commands)));

    expect(explanation).toEqual(
      expect.arrayContaining([
        "Dangling pointer — p points to memory that was already freed.",
        "Double free — freeing the same block twice is undefined behavior."
      ])
    );
  });

  it("explains recursive ENTER_FUNCTION with depth", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(3)" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(2)" }
    ];
    const result = explainEvent(snapshotAt(commands, 3));
    expect(result).toContain("Stack frame for factorial pushed. Locals will live until the function returns.");
    expect(result).toContain("Recursive call — call stack is now 3 frames deep.");
  });

  it("explains base case on recursive ENTER_FUNCTION", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(3)" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(1) — base case" }
    ];
    const result = explainEvent(snapshotAt(commands, 3));
    expect(result).toContain("Base case reached — no further recursion.");
  });

  it("appends MEMORY_LEAK hint when diagnostic present", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "leaked", dataType: "int *", label: "Declare leaked" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "leaked" },
        size: 4,
        label: "Allocate int"
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "leaked" },
        source: { kind: "null" },
        label: "leaked = NULL"
      }
    ];
    const snap = getFinalSnapshot(runMemoryProgram(commands));
    expect(snap.diagnostics.some((d) => d.type === "MEMORY_LEAK")).toBe(true);
    expect(explainEvent(snap)).toContain("Memory leak — this block has no live pointer references and cannot be freed.");
  });

  it("appends DANGLING_POINTER hint with variable name", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int" }
    ];
    const snap = getFinalSnapshot(runMemoryProgram(commands));
    expect(explainEvent(snap)).toContain("Dangling pointer — p points to memory that was already freed.");
  });

  it("appends DOUBLE_FREE hint when block freed twice", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int" },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int again" }
    ];
    const snapshots = runMemoryProgram(commands);
    const snap = snapshots[snapshots.length - 1]!;
    expect(explainEvent(snap)).toContain("Double free — freeing the same block twice is undefined behavior.");
  });

  it("appends NULL_POINTER_DEREFERENCE hint on read through null pointer", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      { type: "READ_VALUE", source: { kind: "variable", name: "p" }, label: "Read p" }
    ];
    const snap = getFinalSnapshot(runMemoryProgram(commands));
    expect(snap.diagnostics.some((d) => d.type === "NULL_POINTER_DEREFERENCE")).toBe(true);
    expect(explainEvent(snap)).toContain("Null dereference — reading or writing through a null pointer crashes the program.");
  });

  it("appends USE_AFTER_FREE hint on read through freed pointer", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free int" },
      { type: "READ_VALUE", source: { kind: "variable", name: "p" }, label: "Read p (dangling)" }
    ];
    const snap = getFinalSnapshot(runMemoryProgram(commands));
    expect(snap.diagnostics.some((d) => d.type === "USE_AFTER_FREE")).toBe(true);
    expect(explainEvent(snap)).toContain("Use after free — accessing freed memory is undefined behavior.");
  });

  it("explains EXIT_FUNCTION with return value from label", () => {
    const commands: MemoryCommand[] = [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(1)" },
      { type: "EXIT_FUNCTION", label: "factorial(1) returns 1" }
    ];
    const result = explainEvent(snapshotAt(commands, 3));
    expect(result).toContain("Stack frame popped. Locals released; pointers into this frame become invalid.");
    expect(result).toContain("Returns 1 — this frame is unwound from the call stack.");
  });
});
