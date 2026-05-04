import type { MemoryValue, PointerSource, StructField, ValueTarget } from "./types";

type BaseCommand = {
  label?: string;
};

export type EnterFunctionCommand = BaseCommand & {
  type: "ENTER_FUNCTION";
  functionName: string;
};

export type ExitFunctionCommand = BaseCommand & {
  type: "EXIT_FUNCTION";
};

export type DeclareVariableCommand = BaseCommand & {
  type: "DECLARE_VARIABLE";
  name: string;
  dataType: string;
  initialValue?: MemoryValue;
};

export type MallocCommand = BaseCommand & {
  type: "MALLOC";
  target: ValueTarget;
  size: number;
  label: string;
  fields?: StructField[];
};

export type FreeCommand = BaseCommand & {
  type: "FREE";
  pointer: ValueTarget;
};

export type AssignPointerCommand = BaseCommand & {
  type: "ASSIGN_POINTER";
  target: ValueTarget;
  source: PointerSource;
};

export type WriteFieldCommand = BaseCommand & {
  type: "WRITE_FIELD";
  blockId: string;
  fieldName: string;
  value: MemoryValue;
};

export type WriteArrayIndexCommand = BaseCommand & {
  type: "WRITE_ARRAY_INDEX";
  blockId: string;
  index: number;
  value: MemoryValue;
};

export type ReadValueCommand = BaseCommand & {
  type: "READ_VALUE";
  source: ValueTarget;
};

export type MemoryCommand =
  | EnterFunctionCommand
  | ExitFunctionCommand
  | DeclareVariableCommand
  | MallocCommand
  | FreeCommand
  | AssignPointerCommand
  | WriteFieldCommand
  | WriteArrayIndexCommand
  | ReadValueCommand;

export const describeTarget = (target: ValueTarget): string => {
  if (target.kind === "variable") {
    return target.name;
  }

  return `${target.blockId}.${target.fieldName}`;
};

export const describeCommand = (command: MemoryCommand): string => {
  if (command.label) {
    return command.label;
  }

  switch (command.type) {
    case "ENTER_FUNCTION":
      return `Enter ${command.functionName}`;
    case "EXIT_FUNCTION":
      return "Exit current function";
    case "DECLARE_VARIABLE":
      return `Declare ${command.name}`;
    case "MALLOC":
      return `Allocate ${command.label}`;
    case "FREE":
      return `Free ${describeTarget(command.pointer)}`;
    case "ASSIGN_POINTER":
      return `Assign ${describeTarget(command.target)}`;
    case "WRITE_FIELD":
      return `Write ${command.blockId}.${command.fieldName}`;
    case "WRITE_ARRAY_INDEX":
      return `Write ${command.blockId}[${command.index}]`;
    case "READ_VALUE":
      return `Read ${describeTarget(command.source)}`;
  }
};

