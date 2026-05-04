import { describeTarget } from "../domain/commands";
import type { MemorySnapshot } from "../domain/snapshots";

export const explainEvent = (snapshot: MemorySnapshot): string[] => {
  const explanations: string[] = [];
  const command = snapshot.event.command;

  if (command?.type === "MALLOC") {
    explanations.push(`malloc reserves ${command.size} bytes on the heap.`);
  }

  if (command?.type === "FREE") {
    explanations.push(`free releases the heap block referenced by ${describeTarget(command.pointer)}.`);
  }

  for (const diagnostic of snapshot.diagnostics) {
    if (diagnostic.type === "DANGLING_POINTER" && diagnostic.targetLabel) {
      explanations.push(`${diagnostic.targetLabel} still points at released memory, so it is dangling.`);
    }

    if (diagnostic.type === "DOUBLE_FREE") {
      explanations.push("The same heap block was released more than once.");
    }

    if (diagnostic.type === "MEMORY_LEAK") {
      explanations.push(`${diagnostic.targetLabel ?? "A heap block"} is allocated but no live pointer can reach it.`);
    }

    if (diagnostic.type === "NULL_POINTER_DEREFERENCE") {
      explanations.push(`${diagnostic.targetLabel ?? "A pointer"} is null, so reading through it is invalid.`);
    }

    if (diagnostic.type === "USE_AFTER_FREE") {
      explanations.push(`${diagnostic.targetLabel ?? "A pointer"} tries to use memory after it was freed.`);
    }

    if (diagnostic.type === "HEAP_FRAGMENTATION") {
      explanations.push("Freed and allocated heap blocks coexist, which can fragment the heap.");
    }
  }

  return [...new Set(explanations)];
};

