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
    const recursiveDepth = snapshot.stackFrames.filter((f) => f.functionName === command.functionName).length;
    if (recursiveDepth > 1) {
      explanations.push(`Recursive call — call stack is now ${snapshot.stackFrames.length} frames deep.`);
      if (snapshot.event.label.includes("base case")) {
        explanations.push("Base case reached — no further recursion.");
      }
    }
  }

  if (command?.type === "EXIT_FUNCTION") {
    explanations.push("Stack frame popped. Locals released; pointers into this frame become invalid.");
    const returnMatch = snapshot.event.label.match(/returns (\S+)/);
    if (returnMatch) {
      explanations.push(`Returns ${returnMatch[1]} — this frame is unwound from the call stack.`);
    }
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
    if (diagnostic.type === "MEMORY_LEAK") {
      explanations.push("Memory leak — this block has no live pointer references and cannot be freed.");
    }

    if (diagnostic.type === "DANGLING_POINTER") {
      explanations.push(`Dangling pointer — ${diagnostic.targetLabel ?? "a pointer"} points to memory that was already freed.`);
    }

    if (diagnostic.type === "DOUBLE_FREE") {
      explanations.push("Double free — freeing the same block twice is undefined behavior.");
    }

    if (diagnostic.type === "NULL_POINTER_DEREFERENCE") {
      explanations.push("Null dereference — reading or writing through a null pointer crashes the program.");
    }

    if (diagnostic.type === "USE_AFTER_FREE") {
      explanations.push("Use after free — accessing freed memory is undefined behavior.");
    }

    if (diagnostic.type === "HEAP_FRAGMENTATION") {
      explanations.push("Freed and allocated heap blocks coexist, which can fragment the heap.");
    }
  }

  return [...new Set(explanations)];
};

