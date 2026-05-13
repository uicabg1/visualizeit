import { describeTarget } from "../domain/commands";
import type { MemorySnapshot } from "../domain/snapshots";
import type { PointerSource } from "../domain/types";

const describeSource = (source: PointerSource): string => {
  if (source.kind === "heapBlock") return "a heap block";
  if (source.kind === "null") return "null";
  return describeTarget(source.target);
};

export const explainEvent = (snapshot: MemorySnapshot): string[] => {
  const explanations: string[] = [];
  const command = snapshot.event.command;

  if (command?.type === "ENTER_FUNCTION") {
    explanations.push(`Stack frame for ${command.functionName} pushed. Locals will live until the function returns.`);
  }

  if (command?.type === "EXIT_FUNCTION") {
    explanations.push("Stack frame popped. Locals released; pointers into this frame become invalid.");
  }

  if (command?.type === "DECLARE_VARIABLE") {
    if (command.dataType.includes("*")) {
      explanations.push(`Pointer ${command.name} reserved; currently null until assigned.`);
    } else {
      explanations.push(`Local ${command.name} reserved on the active stack frame.`);
    }
  }

  if (command?.type === "MALLOC") {
    explanations.push(`malloc reserves ${command.size} bytes on the heap.`);
  }

  if (command?.type === "FREE") {
    explanations.push(`free releases the heap block referenced by ${describeTarget(command.pointer)}.`);
  }

  if (command?.type === "WRITE_FIELD") {
    explanations.push(`Field ${command.fieldName} written to heap block.`);
  }

  if (command?.type === "WRITE_ARRAY_INDEX") {
    explanations.push(`Array element [${command.index}] written to heap block.`);
  }

  if (command?.type === "ASSIGN_POINTER") {
    explanations.push(`${describeTarget(command.target)} now references ${describeSource(command.source)}.`);
  }

  if (command?.type === "READ_VALUE") {
    explanations.push(`Reading value through ${describeTarget(command.source)}.`);
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

