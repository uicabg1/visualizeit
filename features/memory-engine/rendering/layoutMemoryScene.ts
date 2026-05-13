import type { MemoryDiagnostic } from "../domain/diagnostics";
import type { MemorySnapshot, ReleasedStackFrame } from "../domain/snapshots";
import type { MemoryValue, PointerStatus } from "../domain/types";
import type {
  DiagnosticBadgeNode,
  HeapBlockNode,
  HeapFieldNode,
  LayoutMemorySceneOptions,
  MemoryScene,
  MemorySceneLane,
  MemorySceneSelectable,
  PointerEdgeNode,
  ScenePoint,
  SceneRect,
  StackFrameNode,
  StackVariableNode
} from "./canvasTypes";

type ResolvedLayoutOptions = Required<Omit<LayoutMemorySceneOptions, "regions">>;

type PointerSourceNode = {
  id: string;
  targetBlockId: string | null;
  status: PointerStatus | null;
  addressLabel: string | null;
  anchor: ScenePoint;
};

const defaultOptions: ResolvedLayoutOptions = {
  minWidth: 960,
  minHeight: 520,
  padding: 40,
  stackX: 48,
  heapX: 528,
  topY: 56,
  stackWidth: 360,
  heapWidth: 360,
  frameHeaderHeight: 36,
  blockHeaderHeight: 44,
  rowHeight: 40,
  gap: 24,
  badgeSize: 26
};

const resolveOptions = (options: LayoutMemorySceneOptions = {}): ResolvedLayoutOptions => ({
  ...defaultOptions,
  ...options
});

const rect = (x: number, y: number, width: number, height: number): SceneRect => ({
  x,
  y,
  width,
  height
});

const rightAnchor = (sourceRect: SceneRect): ScenePoint => ({
  x: sourceRect.x + sourceRect.width,
  y: sourceRect.y + sourceRect.height / 2
});

const leftAnchor = (sourceRect: SceneRect): ScenePoint => ({
  x: sourceRect.x,
  y: sourceRect.y + sourceRect.height / 2
});

const valuePointerTarget = (
  value: MemoryValue
): Pick<PointerSourceNode, "targetBlockId" | "status" | "addressLabel"> => {
  if (value.kind !== "pointer") {
    return {
      targetBlockId: null,
      status: null,
      addressLabel: null
    };
  }

  return {
    targetBlockId: value.targetBlockId,
    status: value.status ?? "valid",
    addressLabel: value.address ?? value.targetBlockId
  };
};

const formatValue = (value: MemoryValue): string => {
  if (value.kind === "number") {
    return String(value.value);
  }

  if (value.kind === "string") {
    return `"${value.value}"`;
  }

  if (value.kind === "null") {
    return "null";
  }

  if (value.targetBlockId === null || value.status === "null") {
    return "NULL";
  }

  return `${value.address ?? value.targetBlockId} (${value.status ?? "valid"})`;
};

const variableSelectable = (node: StackVariableNode): MemorySceneSelectable => ({
  id: node.id,
  kind: "stack-variable",
  label: node.label,
  detail: `${node.dataType} ${node.label}`,
  valueLabel: node.valueLabel,
  targetId: node.pointerTargetBlockId ?? undefined,
  rect: node.rect
});

const fieldSelectable = (node: HeapFieldNode): MemorySceneSelectable => ({
  id: node.id,
  kind: "heap-field",
  label: node.label,
  detail: `${node.dataType} ${node.label}`,
  valueLabel: node.valueLabel,
  targetId: node.pointerTargetBlockId ?? undefined,
  rect: node.rect
});

const diagnosticDetail = (diagnostic: MemoryDiagnostic): string =>
  `${diagnostic.severity.toUpperCase()}: ${diagnostic.message}`;

const containsPoint = (candidateRect: SceneRect, point: ScenePoint): boolean =>
  point.x >= candidateRect.x &&
  point.x <= candidateRect.x + candidateRect.width &&
  point.y >= candidateRect.y &&
  point.y <= candidateRect.y + candidateRect.height;

const selectionPriority = (selectable: MemorySceneSelectable): number => {
  switch (selectable.kind) {
    case "diagnostic":
      return 5;
    case "heap-field":
    case "stack-variable":
      return 4;
    case "heap-block":
      return 2;
    case "stack-frame":
      return 1;
  }
};

export const layoutMemoryScene = (
  snapshot: MemorySnapshot,
  options?: LayoutMemorySceneOptions
): MemoryScene => {
  const layout = resolveOptions(options);
  const regions = options?.regions ?? {};
  const showStack = regions.stack !== false;
  const showHeap = regions.heap !== false;

  // Effective content dimensions — expand to fill canvas when one lane is hidden
  const singleLaneContentWidth = layout.minWidth - 2 * layout.stackX;
  const effectiveStackX = layout.stackX;
  const effectiveStackWidth = showStack && !showHeap ? singleLaneContentWidth : layout.stackWidth;
  const effectiveHeapX = showHeap && !showStack ? layout.stackX : layout.heapX;
  const effectiveHeapWidth = showHeap && !showStack ? singleLaneContentWidth : layout.heapWidth;

  const selectables: MemorySceneSelectable[] = [];
  const pointerSources: PointerSourceNode[] = [];

  const stackFrames: StackFrameNode[] = [];
  let nextStackY = layout.topY;

  if (showStack) {
    for (const frame of snapshot.stackFrames) {
      const frameHeight = layout.frameHeaderHeight + Math.max(frame.variables.length, 1) * layout.rowHeight + 16;
      const frameRect = rect(effectiveStackX, nextStackY, effectiveStackWidth, frameHeight);
      const headerRect = rect(frameRect.x, frameRect.y, frameRect.width, layout.frameHeaderHeight);
      const variables: StackVariableNode[] = frame.variables.map((variable, index) => {
        const variableRect = rect(
          frameRect.x + 14,
          frameRect.y + layout.frameHeaderHeight + 8 + index * layout.rowHeight,
          frameRect.width - 28,
          layout.rowHeight - 6
        );
        const pointerTarget = valuePointerTarget(variable.value);
        const variableNode: StackVariableNode = {
          id: `stack-variable:${variable.id}`,
          variableId: variable.id,
          frameId: frame.id,
          label: variable.name,
          dataType: variable.dataType,
          valueLabel: formatValue(variable.value),
          rect: variableRect,
          anchor: rightAnchor(variableRect),
          pointerTargetBlockId: pointerTarget.targetBlockId,
          pointerStatus: pointerTarget.status
        };

        pointerSources.push({
          id: variableNode.id,
          targetBlockId: pointerTarget.targetBlockId,
          status: pointerTarget.status,
          addressLabel: pointerTarget.addressLabel,
          anchor: variableNode.anchor
        });
        selectables.push(variableSelectable(variableNode));

        return variableNode;
      });

      const frameNode: StackFrameNode = {
        id: `stack-frame:${frame.id}`,
        frameId: frame.id,
        label: frame.functionName,
        rect: frameRect,
        headerRect,
        variables
      };

      stackFrames.push(frameNode);
      selectables.push({
        id: frameNode.id,
        kind: "stack-frame",
        label: frameNode.label,
        detail: `${frameNode.label} stack frame`,
        rect: frameNode.rect
      });
      nextStackY += frameHeight + layout.gap;
    }
  }

  // Released frames — ghost representation of the last popped frame
  const releasedFrames: StackFrameNode[] = showStack
    ? snapshot.releasedFrames.map((releasedFrame: ReleasedStackFrame) => {
        const frameHeight =
          layout.frameHeaderHeight + Math.max(releasedFrame.variables.length, 1) * layout.rowHeight + 16;
        const frameRect = rect(effectiveStackX, nextStackY, effectiveStackWidth, frameHeight);
        const headerRect = rect(frameRect.x, frameRect.y, frameRect.width, layout.frameHeaderHeight);
        const variables: StackVariableNode[] = releasedFrame.variables.map((variable, index) => {
          const variableRect = rect(
            frameRect.x + 14,
            frameRect.y + layout.frameHeaderHeight + 8 + index * layout.rowHeight,
            frameRect.width - 28,
            layout.rowHeight - 6
          );
          return {
            id: `released-variable:${variable.id}`,
            variableId: variable.id,
            frameId: `released-${releasedFrame.functionName}`,
            label: variable.name,
            dataType: variable.dataType,
            valueLabel: formatValue(variable.value),
            rect: variableRect,
            anchor: rightAnchor(variableRect),
            pointerTargetBlockId: null,
            pointerStatus: null,
            opacity: 0.3
          };
        });
        nextStackY += frameHeight + layout.gap;
        return {
          id: `released-frame:${releasedFrame.functionName}`,
          frameId: `released-${releasedFrame.functionName}`,
          label: releasedFrame.functionName,
          rect: frameRect,
          headerRect,
          variables,
          opacity: 0.3,
          released: true
        };
      })
    : [];

  const heapBlocks: HeapBlockNode[] = [];
  const heapBlockByBlockId = new Map<string, HeapBlockNode>();
  let nextHeapY = layout.topY;

  if (showHeap) {
    for (const block of snapshot.heapBlocks) {
      const blockHeight = layout.blockHeaderHeight + Math.max(block.fields.length, 1) * layout.rowHeight + 16;
      const blockRect = rect(effectiveHeapX, nextHeapY, effectiveHeapWidth, blockHeight);
      const headerRect = rect(blockRect.x, blockRect.y, blockRect.width, layout.blockHeaderHeight);
      const fields: HeapFieldNode[] = block.fields.map((field, index) => {
        const fieldRect = rect(
          blockRect.x + 14,
          blockRect.y + layout.blockHeaderHeight + 8 + index * layout.rowHeight,
          blockRect.width - 28,
          layout.rowHeight - 6
        );
        const pointerTarget = valuePointerTarget(field.value);
        const fieldNode: HeapFieldNode = {
          id: `heap-field:${block.id}:${field.name}`,
          blockId: block.id,
          label: field.name,
          dataType: field.dataType,
          valueLabel: formatValue(field.value),
          rect: fieldRect,
          anchor: rightAnchor(fieldRect),
          pointerTargetBlockId: pointerTarget.targetBlockId,
          pointerStatus: pointerTarget.status
        };

        pointerSources.push({
          id: fieldNode.id,
          targetBlockId: pointerTarget.targetBlockId,
          status: pointerTarget.status,
          addressLabel: pointerTarget.addressLabel,
          anchor: fieldNode.anchor
        });
        selectables.push(fieldSelectable(fieldNode));

        return fieldNode;
      });

      const blockNode: HeapBlockNode = {
        id: `heap-block:${block.id}`,
        blockId: block.id,
        label: block.label,
        address: block.address,
        size: block.size,
        allocated: block.allocated,
        freedAtStep: block.freedAtStep,
        rect: blockRect,
        headerRect,
        fields
      };

      heapBlocks.push(blockNode);
      heapBlockByBlockId.set(block.id, blockNode);
      selectables.push({
        id: blockNode.id,
        kind: "heap-block",
        label: blockNode.label,
        detail: `${blockNode.address} · ${blockNode.size} bytes · ${blockNode.allocated ? "allocated" : "freed"}`,
        rect: blockNode.rect
      });
      nextHeapY += blockHeight + layout.gap;
    }
  }

  const pointerEdges: PointerEdgeNode[] = pointerSources.flatMap((source) => {
    if (!source.targetBlockId) {
      return [];
    }

    const targetBlock = heapBlockByBlockId.get(source.targetBlockId);

    if (!targetBlock || !source.status) {
      return [];
    }

    return [
      {
        id: `pointer:${source.id}->${targetBlock.id}`,
        sourceId: source.id,
        targetId: targetBlock.id,
        targetBlockId: targetBlock.blockId,
        status: source.status,
        from: source.anchor,
        to: leftAnchor(targetBlock.rect),
        label: source.addressLabel ?? targetBlock.address
      }
    ];
  });

  const diagnosticOffsetByTarget = new Map<string, number>();
  const diagnosticBadges: DiagnosticBadgeNode[] = snapshot.diagnostics.map((diagnostic, index) => {
    const targetKey = diagnostic.targetId ?? diagnostic.targetLabel ?? "global";
    const currentOffset = diagnosticOffsetByTarget.get(targetKey) ?? 0;
    diagnosticOffsetByTarget.set(targetKey, currentOffset + 1);

    const targetBlock = diagnostic.targetId ? heapBlockByBlockId.get(diagnostic.targetId) : undefined;
    const badgeRect = targetBlock
      ? rect(
          targetBlock.rect.x + targetBlock.rect.width - layout.badgeSize - 10,
          targetBlock.rect.y + 10 + currentOffset * (layout.badgeSize + 6),
          layout.badgeSize,
          layout.badgeSize
        )
      : rect(
          effectiveHeapX,
          Math.max(nextHeapY, nextStackY) + currentOffset * (layout.badgeSize + 6),
          layout.badgeSize,
          layout.badgeSize
        );

    const badge: DiagnosticBadgeNode = {
      id: `diagnostic:${index}:${diagnostic.type}:${targetKey}`,
      diagnosticType: diagnostic.type,
      severity: diagnostic.severity,
      message: diagnostic.message,
      targetId: diagnostic.targetId,
      targetLabel: diagnostic.targetLabel,
      rect: badgeRect
    };

    selectables.push({
      id: badge.id,
      kind: "diagnostic",
      label: diagnostic.type,
      detail: diagnosticDetail(diagnostic),
      severity: diagnostic.severity,
      targetId: diagnostic.targetId,
      rect: badge.rect
    });

    return badge;
  });

  const contentHeight = Math.max(nextStackY, nextHeapY) + layout.padding;
  const boundsHeight = Math.max(layout.minHeight, contentHeight);
  const laneY = 18;
  const laneH = boundsHeight - 36;

  const stackLane: MemorySceneLane | undefined = showStack
    ? {
        rect: { x: effectiveStackX - 20, y: laneY, width: effectiveStackWidth + (showHeap ? 50 : 40), height: laneH },
        label: "STACK"
      }
    : undefined;

  const heapLane: MemorySceneLane | undefined = showHeap
    ? {
        rect: {
          x: effectiveHeapX - (showStack ? 30 : 20),
          y: laneY,
          width: effectiveHeapWidth + (showStack ? 50 : 40),
          height: laneH
        },
        label: "HEAP"
      }
    : undefined;

  return {
    bounds: { width: layout.minWidth, height: boundsHeight },
    stackLane,
    heapLane,
    stackFrames,
    releasedFrames,
    heapBlocks,
    pointerEdges,
    diagnosticBadges,
    selectables
  };
};

export const hitTestMemoryScene = (
  scene: Pick<MemoryScene, "selectables">,
  point: ScenePoint
): MemorySceneSelectable | null => {
  let bestMatch: MemorySceneSelectable | null = null;

  for (const selectable of scene.selectables) {
    if (!containsPoint(selectable.rect, point)) {
      continue;
    }

    if (!bestMatch || selectionPriority(selectable) >= selectionPriority(bestMatch)) {
      bestMatch = selectable;
    }
  }

  return bestMatch;
};
