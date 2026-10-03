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
  // T-REFACTOR-10 (schema frozen for WASM parity): pointer to a stack variable
  // (`&local` / `**pp`, consumed by T-CONTENT-3). Optional-only: shipped
  // snapshots never carry it, so serialized output stays byte-identical.
  targetVariable?: {
    frameId: string;
    name: string;
  };
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
    }
  | {
      // T-REFACTOR-10 (schema frozen): addressable slot in a stack frame.
      // `index` targets an array element; only index 0/undefined resolve today
      // (scalar slot) — stack arrays (`int arr[5]`) land with T-CONTENT-2.
      // `frameHint` disambiguates recursive frames by id or functionName.
      kind: "stackSlot";
      frameHint?: string;
      name: string;
      index?: number;
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
  capacity: number; // initial declared field count; 0 = no overflow detection
  label: string;
  allocated: boolean;
  fields: StructField[];
  createdAtStep: number;
  freedAtStep: number | null;
};

