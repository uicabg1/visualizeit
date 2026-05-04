import type { MemoryCommand } from "./commands";
import type { MemoryDiagnostic } from "./diagnostics";
import type { HeapBlock, StackFrame } from "./types";

export type MemoryEvent =
  | {
      commandType: "INITIALIZE";
      label: string;
      command: null;
    }
  | {
      commandType: MemoryCommand["type"];
      label: string;
      command: MemoryCommand;
    };

export type MemorySnapshot = {
  stepIndex: number;
  event: MemoryEvent;
  stackFrames: StackFrame[];
  heapBlocks: HeapBlock[];
  diagnostics: MemoryDiagnostic[];
};

export const cloneSnapshot = (snapshot: MemorySnapshot): MemorySnapshot =>
  structuredClone(snapshot) as MemorySnapshot;

export const getSnapshotSummary = (snapshot: MemorySnapshot): string => {
  const allocatedBlocks = snapshot.heapBlocks.filter((block) => block.allocated).length;
  const freedBlocks = snapshot.heapBlocks.length - allocatedBlocks;

  return [
    `step=${snapshot.stepIndex}`,
    `frames=${snapshot.stackFrames.length}`,
    `allocated=${allocatedBlocks}`,
    `freed=${freedBlocks}`,
    `diagnostics=${snapshot.diagnostics.length}`
  ].join(" ");
};

