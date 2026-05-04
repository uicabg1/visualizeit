export type MemoryAddress = `0x${string}`;

export type PrimitiveValue =
  | {
      kind: "number";
      value: number;
    }
  | {
      kind: "string";
      value: string;
    }
  | {
      kind: "null";
    };

export type PointerStatus = "valid" | "dangling" | "null";

export type PointerValue = {
  kind: "pointer";
  targetBlockId: string | null;
  address?: MemoryAddress | null;
  status?: PointerStatus;
};

export type MemoryValue = PrimitiveValue | PointerValue;

export type ValueTarget =
  | {
      kind: "variable";
      name: string;
    }
  | {
      kind: "heapField";
      blockId: string;
      fieldName: string;
    };

export type PointerSource =
  | {
      kind: "heapBlock";
      blockId: string;
    }
  | {
      kind: "null";
    }
  | {
      kind: "target";
      target: ValueTarget;
    };

export type StructField = {
  name: string;
  dataType: string;
  value: MemoryValue;
};

export type StackVariable = {
  id: string;
  name: string;
  dataType: string;
  value: MemoryValue;
};

export type StackFrame = {
  id: string;
  functionName: string;
  variables: StackVariable[];
};

export type HeapBlock = {
  id: string;
  address: MemoryAddress;
  size: number;
  label: string;
  allocated: boolean;
  fields: StructField[];
  createdAtStep: number;
  freedAtStep: number | null;
};

