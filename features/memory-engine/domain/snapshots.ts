import type { MemoryCommand } from "./commands";
import type { MemoryDiagnostic } from "./diagnostics";
import type { HeapBlock, StackFrame, StackVariable } from "./types";

export type ReleasedStackFrame = {
  functionName: string;
  variables: StackVariable[];
};

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
  releasedFrames: ReleasedStackFrame[];
};
