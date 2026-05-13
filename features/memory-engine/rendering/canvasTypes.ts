import type { DiagnosticSeverity, DiagnosticType } from "../domain/diagnostics";
import type { MemoryAddress, PointerStatus } from "../domain/types";

export type ScenePoint = {
  x: number;
  y: number;
};

export type SceneRect = ScenePoint & {
  width: number;
  height: number;
};

export type MemorySceneSelectionKind =
  | "stack-frame"
  | "stack-variable"
  | "heap-block"
  | "heap-field"
  | "diagnostic";

export type MemorySceneSelectable = {
  id: string;
  kind: MemorySceneSelectionKind;
  label: string;
  detail: string;
  rect: SceneRect;
  valueLabel?: string;
  severity?: DiagnosticSeverity;
  targetId?: string;
};

export type StackVariableNode = {
  id: string;
  variableId: string;
  frameId: string;
  label: string;
  dataType: string;
  valueLabel: string;
  rect: SceneRect;
  anchor: ScenePoint;
  pointerTargetBlockId: string | null;
  pointerStatus: PointerStatus | null;
  opacity?: number;
};

export type StackFrameNode = {
  id: string;
  frameId: string;
  label: string;
  rect: SceneRect;
  headerRect: SceneRect;
  variables: StackVariableNode[];
  opacity?: number;
  released?: boolean;
};

export type HeapFieldNode = {
  id: string;
  blockId: string;
  label: string;
  dataType: string;
  valueLabel: string;
  rect: SceneRect;
  anchor: ScenePoint;
  pointerTargetBlockId: string | null;
  pointerStatus: PointerStatus | null;
  opacity?: number;
};

export type HeapBlockNode = {
  id: string;
  blockId: string;
  label: string;
  address: MemoryAddress;
  size: number;
  allocated: boolean;
  freedAtStep: number | null;
  rect: SceneRect;
  headerRect: SceneRect;
  fields: HeapFieldNode[];
  opacity?: number;
};

export type PointerEdgeNode = {
  id: string;
  sourceId: string;
  targetId: string;
  targetBlockId: string;
  status: PointerStatus;
  from: ScenePoint;
  to: ScenePoint;
  label: string;
  opacity?: number;
};

export type DiagnosticBadgeNode = {
  id: string;
  diagnosticType: DiagnosticType;
  severity: DiagnosticSeverity;
  message: string;
  targetId?: string;
  targetLabel?: string;
  rect: SceneRect;
  opacity?: number;
};

export type MemorySceneLane = {
  rect: SceneRect;
  label: string;
};

export type MemoryScene = {
  bounds: {
    width: number;
    height: number;
  };
  stackLane?: MemorySceneLane;
  heapLane?: MemorySceneLane;
  stackFrames: StackFrameNode[];
  releasedFrames?: StackFrameNode[];
  heapBlocks: HeapBlockNode[];
  pointerEdges: PointerEdgeNode[];
  diagnosticBadges: DiagnosticBadgeNode[];
  selectables: MemorySceneSelectable[];
};

export type LayoutMemorySceneOptions = Partial<{
  minWidth: number;
  minHeight: number;
  padding: number;
  stackX: number;
  heapX: number;
  topY: number;
  stackWidth: number;
  heapWidth: number;
  frameHeaderHeight: number;
  blockHeaderHeight: number;
  rowHeight: number;
  gap: number;
  badgeSize: number;
  regions: { stack?: boolean; heap?: boolean };
}>;
