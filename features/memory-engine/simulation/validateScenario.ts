import type { MemoryCommand } from "../domain/commands";
import type { PointerSource, ValueTarget } from "../domain/types";
import { runMemoryProgram } from "./memoryEngine";
import type { MemoryScenario } from "./fixtures";

export type ScenarioValidationIssue = {
  scenarioId: string;
  message: string;
};

type MutableFrames = {
  frames: Set<string>[];
  mallocCount: number;
  issues: string[];
};

const checkBlock = (ctx: MutableFrames, blockId: string, step: number): void => {
  const match = /^heap-(\d+)$/.exec(blockId);

  if (!match || parseInt(match[1], 10) > ctx.mallocCount) {
    ctx.issues.push(`step ${step}: references unknown heap block "${blockId}" (only ${ctx.mallocCount} allocation(s) so far)`);
  }
};

const checkTarget = (ctx: MutableFrames, target: ValueTarget, step: number): void => {
  if (target.kind === "variable") {
    if (!ctx.frames.some((frame) => frame.has(target.name))) {
      ctx.issues.push(`step ${step}: references undeclared variable "${target.name}"`);
    }
    return;
  }

  checkBlock(ctx, target.blockId, step);
};

const checkSource = (ctx: MutableFrames, source: PointerSource, step: number): void => {
  if (source.kind === "heapBlock") {
    checkBlock(ctx, source.blockId, step);
    return;
  }

  if (source.kind === "target") {
    checkTarget(ctx, source.target, step);
  }
};

const walkCommands = (commands: MemoryCommand[]): string[] => {
  const ctx: MutableFrames = { frames: [], mallocCount: 0, issues: [] };

  commands.forEach((command, index) => {
    const step = index + 1;

    switch (command.type) {
      case "ENTER_FUNCTION":
        ctx.frames.push(new Set());
        return;

      case "EXIT_FUNCTION":
        if (ctx.frames.length === 0) {
          ctx.issues.push(`step ${step}: EXIT_FUNCTION with no active stack frame`);
          return;
        }
        ctx.frames.pop();
        return;

      case "DECLARE_VARIABLE":
        if (ctx.frames.length === 0) {
          ctx.issues.push(`step ${step}: DECLARE_VARIABLE "${command.name}" with no active stack frame`);
          return;
        }
        ctx.frames.at(-1)?.add(command.name);
        return;

      case "MALLOC":
        ctx.mallocCount += 1;
        checkTarget(ctx, command.target, step);
        return;

      case "FREE":
        checkTarget(ctx, command.pointer, step);
        return;

      case "ASSIGN_POINTER":
        checkTarget(ctx, command.target, step);
        checkSource(ctx, command.source, step);
        return;

      case "WRITE_FIELD":
      case "WRITE_ARRAY_INDEX":
        checkBlock(ctx, command.blockId, step);
        return;

      case "READ_VALUE":
        checkTarget(ctx, command.source, step);
        return;
    }
  });

  return ctx.issues;
};

export const validateScenario = (scenario: MemoryScenario): ScenarioValidationIssue[] => {
  const issue = (message: string): ScenarioValidationIssue => ({ scenarioId: scenario.id, message });
  const issues: ScenarioValidationIssue[] = [];

  if (scenario.codeLines && scenario.stepToLine) {
    const codeLines = scenario.codeLines;

    if (scenario.stepToLine.length !== scenario.commands.length) {
      issues.push(issue(`stepToLine length ${scenario.stepToLine.length} !== commands length ${scenario.commands.length}`));
    }

    scenario.stepToLine.forEach((line, index) => {
      if (line < 0 || line >= codeLines.length) {
        issues.push(issue(`stepToLine[${index}] = ${line} out of bounds for codeLines (length ${codeLines.length})`));
      }
    });
  }

  walkCommands(scenario.commands).forEach((message) => issues.push(issue(message)));

  try {
    const snapshots = runMemoryProgram(scenario.commands);

    if (snapshots.length !== scenario.commands.length + 1) {
      issues.push(issue(`engine returned ${snapshots.length} snapshots, expected ${scenario.commands.length + 1}`));
    }

    for (const snapshot of snapshots) {
      for (const diagnostic of snapshot.diagnostics) {
        if (diagnostic.type === "INVALID_TARGET") {
          issues.push(issue(`engine emitted INVALID_TARGET at step ${snapshot.stepIndex}: ${diagnostic.message}`));
        }
      }
    }
  } catch (error) {
    issues.push(issue(`engine threw: ${error instanceof Error ? error.message : String(error)}`));
  }

  return issues;
};

export const validateScenarios = (scenarios: MemoryScenario[]): ScenarioValidationIssue[] => {
  const issues: ScenarioValidationIssue[] = [];
  const seen = new Set<string>();

  for (const scenario of scenarios) {
    if (seen.has(scenario.id)) {
      issues.push({ scenarioId: scenario.id, message: "duplicate scenario id" });
    }
    seen.add(scenario.id);
    issues.push(...validateScenario(scenario));
  }

  return issues;
};
