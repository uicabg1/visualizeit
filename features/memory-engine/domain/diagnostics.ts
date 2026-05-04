export type DiagnosticType =
  | "MEMORY_LEAK"
  | "DANGLING_POINTER"
  | "DOUBLE_FREE"
  | "NULL_POINTER_DEREFERENCE"
  | "USE_AFTER_FREE"
  | "HEAP_FRAGMENTATION";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type MemoryDiagnostic = {
  type: DiagnosticType;
  severity: DiagnosticSeverity;
  message: string;
  targetId?: string;
  targetLabel?: string;
};

export const createDiagnostic = (
  type: DiagnosticType,
  severity: DiagnosticSeverity,
  message: string,
  target?: {
    id?: string;
    label?: string;
  }
): MemoryDiagnostic => ({
  type,
  severity,
  message,
  targetId: target?.id,
  targetLabel: target?.label
});

