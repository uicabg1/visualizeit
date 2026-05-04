import { describe, expect, it } from "vitest";

import type { MemoryCommand } from "../domain/commands";
import { getFinalSnapshot, runMemoryProgram } from "../simulation/memoryEngine";
import { explainEvent } from "./explainEvent";

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
        "p still points at released memory, so it is dangling.",
        "The same heap block was released more than once."
      ])
    );
  });
});
