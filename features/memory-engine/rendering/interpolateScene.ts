import type {
  DiagnosticBadgeNode,
  HeapBlockNode,
  HeapFieldNode,
  MemoryScene,
  PointerEdgeNode,
  ScenePoint,
  SceneRect,
  StackFrameNode,
  StackVariableNode,
} from "./canvasTypes";

// t ∈ [0, 1] → smoothed value; 0 at t=0, 0.5 at t=0.5, 1 at t=1
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpRect = (a: SceneRect, b: SceneRect, t: number): SceneRect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
});

const lerpPoint = (a: ScenePoint, b: ScenePoint, t: number): ScenePoint => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

const tweenVariables = (
  prevVars: StackVariableNode[],
  nextVars: StackVariableNode[],
  t: number
): StackVariableNode[] => {
  const prevMap = new Map(prevVars.map((v) => [v.variableId, v]));
  const nextMap = new Map(nextVars.map((v) => [v.variableId, v]));
  const result: StackVariableNode[] = [];

  for (const next of nextVars) {
    const prev = prevMap.get(next.variableId);
    if (prev) {
      result.push({
        ...next,
        rect: lerpRect(prev.rect, next.rect, t),
        anchor: lerpPoint(prev.anchor, next.anchor, t),
      });
    } else {
      result.push({ ...next, opacity: t });
    }
  }

  for (const prev of prevVars) {
    if (!nextMap.has(prev.variableId)) {
      result.push({ ...prev, opacity: 1 - t });
    }
  }

  return result;
};

const tweenFields = (
  prevFields: HeapFieldNode[],
  nextFields: HeapFieldNode[],
  t: number
): HeapFieldNode[] => {
  const prevMap = new Map(prevFields.map((f) => [f.id, f]));
  const nextMap = new Map(nextFields.map((f) => [f.id, f]));
  const result: HeapFieldNode[] = [];

  for (const next of nextFields) {
    const prev = prevMap.get(next.id);
    if (prev) {
      result.push({
        ...next,
        rect: lerpRect(prev.rect, next.rect, t),
        anchor: lerpPoint(prev.anchor, next.anchor, t),
      });
    } else {
      result.push({ ...next, opacity: t });
    }
  }

  for (const prev of prevFields) {
    if (!nextMap.has(prev.id)) {
      result.push({ ...prev, opacity: 1 - t });
    }
  }

  return result;
};

const tweenFrames = (
  prev: StackFrameNode[],
  next: StackFrameNode[],
  t: number
): StackFrameNode[] => {
  const prevMap = new Map(prev.map((f) => [f.frameId, f]));
  const nextMap = new Map(next.map((f) => [f.frameId, f]));
  const result: StackFrameNode[] = [];

  for (const nextFrame of next) {
    const prevFrame = prevMap.get(nextFrame.frameId);
    if (prevFrame) {
      result.push({
        ...nextFrame,
        rect: lerpRect(prevFrame.rect, nextFrame.rect, t),
        headerRect: lerpRect(prevFrame.headerRect, nextFrame.headerRect, t),
        variables: tweenVariables(prevFrame.variables, nextFrame.variables, t),
      });
    } else {
      result.push({ ...nextFrame, opacity: t });
    }
  }

  for (const prevFrame of prev) {
    if (!nextMap.has(prevFrame.frameId)) {
      result.push({ ...prevFrame, opacity: 1 - t });
    }
  }

  return result;
};

const tweenBlocks = (
  prev: HeapBlockNode[],
  next: HeapBlockNode[],
  t: number
): HeapBlockNode[] => {
  const prevMap = new Map(prev.map((b) => [b.blockId, b]));
  const nextMap = new Map(next.map((b) => [b.blockId, b]));
  const result: HeapBlockNode[] = [];

  for (const nextBlock of next) {
    const prevBlock = prevMap.get(nextBlock.blockId);
    if (prevBlock) {
      result.push({
        ...nextBlock,
        rect: lerpRect(prevBlock.rect, nextBlock.rect, t),
        headerRect: lerpRect(prevBlock.headerRect, nextBlock.headerRect, t),
        fields: tweenFields(prevBlock.fields, nextBlock.fields, t),
      });
    } else {
      result.push({ ...nextBlock, opacity: t });
    }
  }

  for (const prevBlock of prev) {
    if (!nextMap.has(prevBlock.blockId)) {
      result.push({ ...prevBlock, opacity: 1 - t });
    }
  }

  return result;
};

const tweenEdges = (
  prev: PointerEdgeNode[],
  next: PointerEdgeNode[],
  t: number
): PointerEdgeNode[] => {
  const prevMap = new Map(prev.map((e) => [e.id, e]));
  const nextMap = new Map(next.map((e) => [e.id, e]));
  const result: PointerEdgeNode[] = [];

  for (const nextEdge of next) {
    const prevEdge = prevMap.get(nextEdge.id);
    if (prevEdge) {
      result.push({
        ...nextEdge,
        from: lerpPoint(prevEdge.from, nextEdge.from, t),
        to: lerpPoint(prevEdge.to, nextEdge.to, t),
      });
    } else {
      result.push({ ...nextEdge, opacity: t });
    }
  }

  for (const prevEdge of prev) {
    if (!nextMap.has(prevEdge.id)) {
      result.push({ ...prevEdge, opacity: 1 - t });
    }
  }

  return result;
};

const tweenBadges = (
  prev: DiagnosticBadgeNode[],
  next: DiagnosticBadgeNode[],
  t: number
): DiagnosticBadgeNode[] => {
  const prevMap = new Map(prev.map((b) => [b.id, b]));
  const nextMap = new Map(next.map((b) => [b.id, b]));
  const result: DiagnosticBadgeNode[] = [];

  for (const nextBadge of next) {
    if (prevMap.has(nextBadge.id)) {
      result.push(nextBadge);
    } else {
      result.push({ ...nextBadge, opacity: t });
    }
  }

  for (const prevBadge of prev) {
    if (!nextMap.has(prevBadge.id)) {
      result.push({ ...prevBadge, opacity: 1 - t });
    }
  }

  return result;
};

// Produce a composite MemoryScene interpolated between prev and next.
// t=0 → prev-equivalent, t=1 → next-equivalent.
// Snapshots stay deterministic; this is pure render-layer interpolation.
export const tweenRenderModel = (prev: MemoryScene, next: MemoryScene, t: number): MemoryScene => {
  const eased = easeInOutCubic(t);

  return {
    bounds: next.bounds,
    stackFrames: tweenFrames(prev.stackFrames, next.stackFrames, eased),
    heapBlocks: tweenBlocks(prev.heapBlocks, next.heapBlocks, eased),
    pointerEdges: tweenEdges(prev.pointerEdges, next.pointerEdges, eased),
    diagnosticBadges: tweenBadges(prev.diagnosticBadges, next.diagnosticBadges, eased),
    selectables: next.selectables,
  };
};
