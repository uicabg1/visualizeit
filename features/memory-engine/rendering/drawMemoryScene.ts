import type {
  DiagnosticBadgeNode,
  HeapBlockNode,
  HeapFieldNode,
  MemoryScene,
  PointerEdgeNode,
  SceneRect,
  StackFrameNode,
  StackVariableNode
} from "./canvasTypes";

export type DrawMemorySceneOptions = {
  selectedId?: string | null;
};

const PALETTE = {
  amber: "#F5B82E",
  violet: "#7C5CFF",
  teal: "#3FA7FF",
  red: "#FF5C6A",
  baseBg: "#0B0D10",
} as const;

const colors = {
  background: "#070b12",
  gridLine: "rgba(63, 167, 255, 0.04)",
  laneFill: "rgba(255, 255, 255, 0.015)",
  laneStroke: "rgba(255, 255, 255, 0.05)",
  laneLabel: "#6d80a8",
  text: "#dce6f5",
  mutedText: "#6d80a8",
  stackFill: "rgba(245, 165, 30, 0.08)",
  stackStroke: "#f5a51e",
  stackGlow: "rgba(245, 165, 30, 0.28)",
  heapFill: "rgba(6, 214, 160, 0.08)",
  heapStroke: "#06d6a0",
  heapGlow: "rgba(6, 214, 160, 0.28)",
  freedFill: "rgba(167, 139, 250, 0.08)",
  freedStroke: "#a78bfa",
  freedGlow: "rgba(167, 139, 250, 0.22)",
  rowFill: "rgba(255, 255, 255, 0.025)",
  rowStroke: "rgba(255, 255, 255, 0.06)",
  pointer: PALETTE.violet,
  pointerGlow: "rgba(124, 92, 255, 0.45)",
  dangling: PALETTE.red,
  selected: PALETTE.violet,
  warning: PALETTE.amber,
  error: PALETTE.red,
  info: PALETTE.violet,
};

const setFont = (context: CanvasRenderingContext2D, weight: number, size: number): void => {
  context.font = `${weight} ${size}px 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  rect: SceneRect,
  radius: number
): void => {
  const safeRadius = Math.min(radius, rect.width / 2, rect.height / 2);

  context.beginPath();
  context.moveTo(rect.x + safeRadius, rect.y);
  context.lineTo(rect.x + rect.width - safeRadius, rect.y);
  context.quadraticCurveTo(rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + safeRadius);
  context.lineTo(rect.x + rect.width, rect.y + rect.height - safeRadius);
  context.quadraticCurveTo(
    rect.x + rect.width,
    rect.y + rect.height,
    rect.x + rect.width - safeRadius,
    rect.y + rect.height
  );
  context.lineTo(rect.x + safeRadius, rect.y + rect.height);
  context.quadraticCurveTo(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height - safeRadius);
  context.lineTo(rect.x, rect.y + safeRadius);
  context.quadraticCurveTo(rect.x, rect.y, rect.x + safeRadius, rect.y);
  context.closePath();
};

const strokeSelection = (
  context: CanvasRenderingContext2D,
  rect: SceneRect,
  selected: boolean
): void => {
  if (!selected) {
    return;
  }

  context.save();
  context.strokeStyle = colors.selected;
  context.lineWidth = 3;
  drawRoundedRect(
    context,
    {
      x: rect.x - 3,
      y: rect.y - 3,
      width: rect.width + 6,
      height: rect.height + 6
    },
    8
  );
  context.stroke();
  context.restore();
};

const drawRow = (
  context: CanvasRenderingContext2D,
  node: StackVariableNode | HeapFieldNode,
  selectedId?: string | null
): void => {
  context.save();
  context.globalAlpha *= node.opacity ?? 1;
  context.fillStyle = colors.rowFill;
  context.strokeStyle = colors.rowStroke;
  context.lineWidth = 1;
  drawRoundedRect(context, node.rect, 6);
  context.fill();
  context.stroke();

  setFont(context, 700, 13);
  context.fillStyle = colors.text;
  context.fillText(node.label, node.rect.x + 10, node.rect.y + 20);

  setFont(context, 500, 11);
  context.fillStyle = colors.mutedText;
  context.fillText(node.dataType, node.rect.x + 10, node.rect.y + 32);

  setFont(context, 600, 12);
  context.fillStyle = node.pointerStatus === "dangling" ? colors.dangling : colors.text;
  context.textAlign = "right";
  context.fillText(node.valueLabel, node.rect.x + node.rect.width - 10, node.rect.y + 24);
  context.textAlign = "left";

  strokeSelection(context, node.rect, selectedId === node.id);
  context.restore();
};

const drawStackFrame = (
  context: CanvasRenderingContext2D,
  frame: StackFrameNode,
  selectedId?: string | null
): void => {
  context.save();
  context.globalAlpha = frame.opacity ?? 1;
  context.shadowColor = colors.stackGlow;
  context.shadowBlur = 22;
  context.shadowOffsetY = 0;
  context.fillStyle = colors.stackFill;
  drawRoundedRect(context, frame.rect, 8);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = colors.stackStroke;
  context.lineWidth = 1.5;
  context.stroke();

  setFont(context, 800, 14);
  context.fillStyle = colors.text;
  context.fillText(`${frame.label}()`, frame.headerRect.x + 14, frame.headerRect.y + 23);

  if (frame.variables.length === 0) {
    setFont(context, 500, 12);
    context.fillStyle = colors.mutedText;
    context.fillText("empty frame", frame.rect.x + 14, frame.rect.y + frame.headerRect.height + 30);
  }

  for (const variable of frame.variables) {
    drawRow(context, variable, selectedId);
  }

  strokeSelection(context, frame.rect, selectedId === frame.id);
  context.restore();
};

const drawHeapBlock = (
  context: CanvasRenderingContext2D,
  block: HeapBlockNode,
  selectedId?: string | null
): void => {
  context.save();
  context.globalAlpha = block.opacity ?? 1;
  context.shadowColor = block.allocated ? colors.heapGlow : colors.freedGlow;
  context.shadowBlur = 22;
  context.shadowOffsetY = 0;
  context.fillStyle = block.allocated ? colors.heapFill : colors.freedFill;
  drawRoundedRect(context, block.rect, 8);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = block.allocated ? colors.heapStroke : colors.freedStroke;
  context.lineWidth = 1.5;
  if (!block.allocated) {
    context.setLineDash([6, 4]);
  }
  context.stroke();
  context.setLineDash([]);

  setFont(context, 800, 14);
  context.fillStyle = colors.text;
  context.fillText(block.label, block.headerRect.x + 14, block.headerRect.y + 21);

  setFont(context, 600, 11);
  context.fillStyle = colors.mutedText;
  context.fillText(
    `${block.address} · ${block.size} bytes · ${block.allocated ? "allocated" : "freed"}`,
    block.headerRect.x + 14,
    block.headerRect.y + 36
  );

  if (block.fields.length === 0) {
    setFont(context, 500, 12);
    context.fillStyle = colors.mutedText;
    context.fillText("raw bytes", block.rect.x + 14, block.rect.y + block.headerRect.height + 30);
  }

  for (const field of block.fields) {
    drawRow(context, field, selectedId);
  }

  strokeSelection(context, block.rect, selectedId === block.id);
  context.restore();
};

const drawReleasedStackFrame = (
  context: CanvasRenderingContext2D,
  frame: StackFrameNode
): void => {
  context.save();
  context.globalAlpha = frame.opacity ?? 0.3;
  context.shadowColor = colors.stackGlow;
  context.shadowBlur = 14;
  context.fillStyle = colors.stackFill;
  drawRoundedRect(context, frame.rect, 8);
  context.fill();
  context.shadowColor = "transparent";
  context.strokeStyle = colors.stackStroke;
  context.lineWidth = 1.5;
  context.setLineDash([6, 4]);
  context.stroke();
  context.setLineDash([]);

  setFont(context, 800, 14);
  context.fillStyle = colors.text;
  context.fillText(`${frame.label}()`, frame.headerRect.x + 14, frame.headerRect.y + 21);
  setFont(context, 500, 10);
  context.fillStyle = colors.mutedText;
  context.fillText("released", frame.headerRect.x + 14, frame.headerRect.y + 34);

  for (const variable of frame.variables) {
    drawRow(context, variable, null);
  }

  context.restore();
};

const drawPointerEdge = (context: CanvasRenderingContext2D, edge: PointerEdgeNode): void => {
  context.save();
  context.globalAlpha = edge.opacity ?? 1;
  const isDangling = edge.status === "dangling";
  const color = isDangling ? colors.dangling : colors.pointer;
  const controlOffset = Math.max(80, Math.abs(edge.to.x - edge.from.x) / 2);

  context.save();
  context.shadowColor = isDangling ? "rgba(255, 61, 110, 0.45)" : colors.pointerGlow;
  context.shadowBlur = 12;
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = isDangling ? 2.5 : 2.5;
  context.setLineDash(isDangling ? [7, 5] : []);

  context.beginPath();
  context.moveTo(edge.from.x, edge.from.y);
  context.bezierCurveTo(
    edge.from.x + controlOffset,
    edge.from.y,
    edge.to.x - controlOffset,
    edge.to.y,
    edge.to.x,
    edge.to.y
  );
  context.stroke();
  context.setLineDash([]);

  context.beginPath();
  context.moveTo(edge.to.x, edge.to.y);
  context.lineTo(edge.to.x - 9, edge.to.y - 5);
  context.lineTo(edge.to.x - 9, edge.to.y + 5);
  context.closePath();
  context.fill();

  context.shadowColor = "transparent";
  setFont(context, 700, 11);
  context.fillStyle = colors.mutedText;
  context.fillText(edge.label, (edge.from.x + edge.to.x) / 2 - 20, (edge.from.y + edge.to.y) / 2 - 8);
  context.restore(); // inner save
  context.restore(); // outer save (opacity)
};

const diagnosticColor = (badge: DiagnosticBadgeNode): string => {
  if (badge.severity === "error") {
    return colors.error;
  }

  if (badge.severity === "warning") {
    return colors.warning;
  }

  return colors.info;
};

const drawDiagnosticBadge = (
  context: CanvasRenderingContext2D,
  badge: DiagnosticBadgeNode,
  selectedId?: string | null
): void => {
  context.save();
  context.globalAlpha = badge.opacity ?? 1;
  const badgeColor = diagnosticColor(badge);
  context.shadowColor = badgeColor;
  context.shadowBlur = 14;
  context.fillStyle = badgeColor;
  drawRoundedRect(context, badge.rect, 6);
  context.fill();
  context.shadowColor = "transparent";

  setFont(context, 900, 12);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("!", badge.rect.x + badge.rect.width / 2, badge.rect.y + badge.rect.height / 2);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  strokeSelection(context, badge.rect, selectedId === badge.id);
  context.restore();
};

export const drawMemoryScene = (
  context: CanvasRenderingContext2D,
  scene: MemoryScene,
  options: DrawMemorySceneOptions = {}
): void => {
  context.save();
  context.clearRect(0, 0, scene.bounds.width, scene.bounds.height);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, scene.bounds.width, scene.bounds.height);

  context.strokeStyle = colors.gridLine;
  context.lineWidth = 1;
  for (let x = 0; x <= scene.bounds.width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, scene.bounds.height);
    context.stroke();
  }
  for (let y = 0; y <= scene.bounds.height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(scene.bounds.width, y);
    context.stroke();
  }

  context.fillStyle = colors.laneFill;
  context.strokeStyle = colors.laneStroke;
  context.lineWidth = 1;

  const defaultStackLane = { rect: { x: 28, y: 18, width: 410, height: scene.bounds.height - 36 }, label: "STACK" };
  const defaultHeapLane = { rect: { x: 498, y: 18, width: 410, height: scene.bounds.height - 36 }, label: "HEAP" };
  const lanesToDraw = scene.stackLane || scene.heapLane
    ? [scene.stackLane, scene.heapLane].filter((lane): lane is NonNullable<typeof lane> => lane !== undefined)
    : [defaultStackLane, defaultHeapLane];

  setFont(context, 700, 10);
  context.fillStyle = colors.laneLabel;
  for (const lane of lanesToDraw) {
    drawRoundedRect(context, lane.rect, 18);
    context.fillStyle = colors.laneFill;
    context.fill();
    context.strokeStyle = colors.laneStroke;
    context.stroke();
    context.fillStyle = colors.laneLabel;
    context.fillText(lane.label, lane.rect.x + 20, lane.rect.y + 20);
  }

  for (const frame of scene.stackFrames) {
    drawStackFrame(context, frame, options.selectedId);
  }

  for (const frame of scene.releasedFrames ?? []) {
    drawReleasedStackFrame(context, frame);
  }

  for (const block of scene.heapBlocks) {
    drawHeapBlock(context, block, options.selectedId);
  }

  for (const edge of scene.pointerEdges) {
    drawPointerEdge(context, edge);
  }

  for (const badge of scene.diagnosticBadges) {
    drawDiagnosticBadge(context, badge, options.selectedId);
  }

  context.restore();
};
