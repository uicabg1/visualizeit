import { describeCommand, describeTarget, type MemoryCommand } from "../domain/commands";
import { createDiagnostic, type MemoryDiagnostic } from "../domain/diagnostics";
import type { HeapBlock, MemoryAddress, MemoryValue, StackFrame, StructField, ValueTarget } from "../domain/types";
import type { MemorySnapshot } from "../domain/snapshots";

type MutableState = {
  stackFrames: StackFrame[];
  heapBlocks: HeapBlock[];
  eventDiagnostics: MemoryDiagnostic[];
  nextAddress: number;
};

const initialAddress = 0x1000;

const nullPointer = (): MemoryValue => ({
  kind: "pointer",
  targetBlockId: null,
  address: null,
  status: "null"
});

const toAddress = (value: number): MemoryAddress => `0x${value.toString(16)}`;

const createInitialState = (): MutableState => ({
  stackFrames: [],
  heapBlocks: [],
  eventDiagnostics: [],
  nextAddress: initialAddress
});

const cloneValue = (value: MemoryValue): MemoryValue => structuredClone(value) as MemoryValue;

const normalizeValue = (value: MemoryValue, heapBlocks: HeapBlock[]): MemoryValue => {
  if (value.kind !== "pointer") {
    return cloneValue(value);
  }

  if (value.targetBlockId === null) {
    return {
      kind: "pointer",
      targetBlockId: null,
      address: null,
      status: "null"
    };
  }

  const block = heapBlocks.find((candidate) => candidate.id === value.targetBlockId);

  return {
    kind: "pointer",
    targetBlockId: value.targetBlockId,
    address: block?.address ?? null,
    status: block?.allocated ? "valid" : "dangling"
  };
};

const normalizeFields = (fields: StructField[], heapBlocks: HeapBlock[]): StructField[] =>
  fields.map((field) => ({
    ...field,
    value: normalizeValue(field.value, heapBlocks)
  }));

const normalizeFrames = (frames: StackFrame[], heapBlocks: HeapBlock[]): StackFrame[] =>
  frames.map((frame) => ({
    ...frame,
    variables: frame.variables.map((variable) => ({
      ...variable,
      value: normalizeValue(variable.value, heapBlocks)
    }))
  }));

const normalizeBlocks = (blocks: HeapBlock[]): HeapBlock[] =>
  blocks.map((block) => ({
    ...block,
    fields: normalizeFields(block.fields, blocks)
  }));

const currentFrame = (state: MutableState): StackFrame => {
  const frame = state.stackFrames.at(-1);

  if (!frame) {
    throw new Error("A stack frame is required before declaring variables.");
  }

  return frame;
};

const defaultValueFor = (dataType: string): MemoryValue => {
  if (dataType.includes("*")) {
    return nullPointer();
  }

  return { kind: "null" };
};

const readTarget = (state: MutableState, target: ValueTarget): MemoryValue => {
  if (target.kind === "variable") {
    for (const frame of [...state.stackFrames].reverse()) {
      const variable = frame.variables.find((candidate) => candidate.name === target.name);

      if (variable) {
        return variable.value;
      }
    }

    throw new Error(`Unknown variable target: ${target.name}`);
  }

  const block = state.heapBlocks.find((candidate) => candidate.id === target.blockId);
  const field = block?.fields.find((candidate) => candidate.name === target.fieldName);

  if (!block || !field) {
    throw new Error(`Unknown heap field target: ${describeTarget(target)}`);
  }

  return field.value;
};

const writeTarget = (state: MutableState, target: ValueTarget, value: MemoryValue): void => {
  if (target.kind === "variable") {
    for (const frame of [...state.stackFrames].reverse()) {
      const variable = frame.variables.find((candidate) => candidate.name === target.name);

      if (variable) {
        variable.value = value;
        return;
      }
    }

    throw new Error(`Unknown variable target: ${target.name}`);
  }

  const block = state.heapBlocks.find((candidate) => candidate.id === target.blockId);
  const field = block?.fields.find((candidate) => candidate.name === target.fieldName);

  if (!block || !field) {
    throw new Error(`Unknown heap field target: ${describeTarget(target)}`);
  }

  field.value = value;
};

const addEventDiagnostic = (state: MutableState, diagnostic: MemoryDiagnostic): void => {
  state.eventDiagnostics.push(diagnostic);
};

const applyCommand = (state: MutableState, command: MemoryCommand, stepIndex: number): void => {
  switch (command.type) {
    case "ENTER_FUNCTION": {
      state.stackFrames.push({
        id: `frame-${state.stackFrames.length + 1}`,
        functionName: command.functionName,
        variables: []
      });
      return;
    }

    case "EXIT_FUNCTION": {
      state.stackFrames.pop();
      return;
    }

    case "DECLARE_VARIABLE": {
      const frame = currentFrame(state);
      frame.variables.push({
        id: `${frame.id}-${command.name}`,
        name: command.name,
        dataType: command.dataType,
        value: command.initialValue ? cloneValue(command.initialValue) : defaultValueFor(command.dataType)
      });
      return;
    }

    case "MALLOC": {
      const id = `heap-${state.heapBlocks.length + 1}`;
      const address = toAddress(state.nextAddress);
      const block: HeapBlock = {
        id,
        address,
        size: command.size,
        label: command.label,
        allocated: true,
        fields: command.fields?.map((field) => ({ ...field, value: cloneValue(field.value) })) ?? [],
        createdAtStep: stepIndex,
        freedAtStep: null
      };

      state.heapBlocks.push(block);
      state.nextAddress += Math.max(command.size, 1);
      writeTarget(state, command.target, {
        kind: "pointer",
        targetBlockId: id,
        address,
        status: "valid"
      });
      return;
    }

    case "ASSIGN_POINTER": {
      const source = command.source;

      if (source.kind === "null") {
        writeTarget(state, command.target, nullPointer());
        return;
      }

      if (source.kind === "heapBlock") {
        const block = state.heapBlocks.find((candidate) => candidate.id === source.blockId);
        writeTarget(state, command.target, {
          kind: "pointer",
          targetBlockId: source.blockId,
          address: block?.address ?? null,
          status: block?.allocated ? "valid" : "dangling"
        });
        return;
      }

      writeTarget(state, command.target, cloneValue(readTarget(state, source.target)));
      return;
    }

    case "WRITE_FIELD": {
      const block = state.heapBlocks.find((candidate) => candidate.id === command.blockId);

      if (!block) {
        throw new Error(`Unknown heap block: ${command.blockId}`);
      }

      if (!block.allocated) {
        addEventDiagnostic(
          state,
          createDiagnostic("USE_AFTER_FREE", "error", `Cannot write to released block ${block.id}.`, {
            id: block.id,
            label: block.label
          })
        );
        return;
      }

      const field = block.fields.find((candidate) => candidate.name === command.fieldName);

      if (field) {
        field.value = cloneValue(command.value);
      } else {
        block.fields.push({
          name: command.fieldName,
          dataType: "unknown",
          value: cloneValue(command.value)
        });
      }
      return;
    }

    case "WRITE_ARRAY_INDEX": {
      const block = state.heapBlocks.find((candidate) => candidate.id === command.blockId);

      if (!block) {
        throw new Error(`Unknown heap block: ${command.blockId}`);
      }

      block.fields[command.index] = {
        name: `[${command.index}]`,
        dataType: "array-slot",
        value: cloneValue(command.value)
      };
      return;
    }

    case "READ_VALUE": {
      const value = normalizeValue(readTarget(state, command.source), state.heapBlocks);

      if (value.kind === "pointer" && value.status === "null") {
        addEventDiagnostic(
          state,
          createDiagnostic("NULL_POINTER_DEREFERENCE", "error", `${describeTarget(command.source)} is null.`, {
            label: describeTarget(command.source)
          })
        );
      }

      if (value.kind === "pointer" && value.status === "dangling") {
        addEventDiagnostic(
          state,
          createDiagnostic("USE_AFTER_FREE", "error", `${describeTarget(command.source)} reads released memory.`, {
            id: value.targetBlockId ?? undefined,
            label: describeTarget(command.source)
          })
        );
      }
      return;
    }

    case "FREE": {
      const value = normalizeValue(readTarget(state, command.pointer), state.heapBlocks);

      if (value.kind !== "pointer" || value.targetBlockId === null) {
        addEventDiagnostic(
          state,
          createDiagnostic("NULL_POINTER_DEREFERENCE", "error", `${describeTarget(command.pointer)} does not reference heap memory.`, {
            label: describeTarget(command.pointer)
          })
        );
        return;
      }

      const block = state.heapBlocks.find((candidate) => candidate.id === value.targetBlockId);

      if (!block) {
        throw new Error(`Unknown heap block: ${value.targetBlockId}`);
      }

      if (!block.allocated) {
        addEventDiagnostic(
          state,
          createDiagnostic("DOUBLE_FREE", "error", `Block ${block.id} was already released.`, {
            id: block.id,
            label: block.label
          })
        );
        return;
      }

      block.allocated = false;
      block.freedAtStep = stepIndex;
      return;
    }
  }
};

type PointerReference = {
  label: string;
  value: MemoryValue;
};

const collectPointerReferences = (snapshot: Pick<MemorySnapshot, "stackFrames" | "heapBlocks">): PointerReference[] => {
  const references: PointerReference[] = [];

  for (const frame of snapshot.stackFrames) {
    for (const variable of frame.variables) {
      if (variable.value.kind === "pointer") {
        references.push({ label: variable.name, value: variable.value });
      }
    }
  }

  for (const block of snapshot.heapBlocks) {
    for (const field of block.fields) {
      if (field.value.kind === "pointer") {
        references.push({ label: `${block.id}.${field.name}`, value: field.value });
      }
    }
  }

  return references;
};

const dedupeDiagnostics = (diagnostics: MemoryDiagnostic[]): MemoryDiagnostic[] => {
  const seen = new Set<string>();
  const unique: MemoryDiagnostic[] = [];

  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.type}:${diagnostic.targetId ?? ""}:${diagnostic.targetLabel ?? ""}:${diagnostic.message}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(diagnostic);
    }
  }

  return unique;
};

const deriveDiagnostics = (snapshot: Pick<MemorySnapshot, "stackFrames" | "heapBlocks">): MemoryDiagnostic[] => {
  const diagnostics: MemoryDiagnostic[] = [];
  const references = collectPointerReferences(snapshot);

  for (const reference of references) {
    const value = reference.value;

    if (value.kind === "pointer" && value.status === "dangling") {
      diagnostics.push(
        createDiagnostic("DANGLING_POINTER", "warning", `${reference.label} points to released memory.`, {
          id: value.targetBlockId ?? undefined,
          label: reference.label
        })
      );
    }
  }

  for (const block of snapshot.heapBlocks) {
    if (!block.allocated) {
      continue;
    }

    const hasLiveReference = references.some((reference) => {
      const value = reference.value;
      return value.kind === "pointer" && value.status === "valid" && value.targetBlockId === block.id;
    });

    if (!hasLiveReference) {
      diagnostics.push(
        createDiagnostic("MEMORY_LEAK", "warning", `${block.label} has no live pointer references.`, {
          id: block.id,
          label: block.label
        })
      );
    }
  }

  const hasAllocatedBlock = snapshot.heapBlocks.some((block) => block.allocated);
  const hasFreedBlock = snapshot.heapBlocks.some((block) => !block.allocated);

  if (hasAllocatedBlock && hasFreedBlock) {
    diagnostics.push(
      createDiagnostic("HEAP_FRAGMENTATION", "info", "Freed and allocated heap blocks coexist.")
    );
  }

  return diagnostics;
};

const createSnapshot = (state: MutableState, stepIndex: number, command: MemoryCommand | null): MemorySnapshot => {
  const heapBlocks = normalizeBlocks(state.heapBlocks);
  const stackFrames = normalizeFrames(state.stackFrames, heapBlocks);
  const snapshotBase = { stackFrames, heapBlocks };

  return {
    stepIndex,
    event: command
      ? {
          commandType: command.type,
          label: describeCommand(command),
          command
        }
      : {
          commandType: "INITIALIZE",
          label: "Initial memory state",
          command: null
        },
    stackFrames,
    heapBlocks,
    diagnostics: dedupeDiagnostics([...state.eventDiagnostics, ...deriveDiagnostics(snapshotBase)])
  };
};

export const runMemoryProgram = (commands: MemoryCommand[]): MemorySnapshot[] => {
  const state = createInitialState();
  const snapshots: MemorySnapshot[] = [createSnapshot(state, 0, null)];

  commands.forEach((command, index) => {
    const stepIndex = index + 1;
    applyCommand(state, command, stepIndex);
    snapshots.push(createSnapshot(state, stepIndex, command));
  });

  return snapshots;
};

export const getFinalSnapshot = (snapshots: MemorySnapshot[]): MemorySnapshot => {
  const snapshot = snapshots.at(-1);

  if (!snapshot) {
    throw new Error("Expected at least one memory snapshot.");
  }

  return snapshot;
};
