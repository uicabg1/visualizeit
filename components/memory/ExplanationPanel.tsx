"use client";

import { useState } from "react";

import { describeCommand, type MemoryCommand } from "@/features/memory-engine/domain/commands";
import type { MemorySnapshot } from "@/features/memory-engine/domain/snapshots";
import type { MemorySceneSelectable } from "@/features/memory-engine/rendering/canvasTypes";

type ExplanationPanelProps = {
  snapshot: MemorySnapshot;
  explanations: string[];
  scenarioCommands: MemoryCommand[];
  selected: MemorySceneSelectable | null;
  codeLines?: string[];
  highlightedLine?: number;
};

type LearningTab = "code" | "explanation";

const tabs: { id: LearningTab; label: string; shortcut: string }[] = [
  { id: "code", label: "Code", shortcut: "C" },
  { id: "explanation", label: "Explanation", shortcut: "E" }
];

export function ExplanationPanel({ snapshot, explanations, scenarioCommands, selected, codeLines, highlightedLine }: ExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<LearningTab>("code");
  const activeCommandIndex = snapshot.stepIndex - 1;

  const hasVariables = snapshot.stackFrames.length > 0 || snapshot.heapBlocks.length > 0;

  return (
    <aside className="explanation-panel" aria-label="Explanation panel">
      <nav className="learning-tabs" aria-label="Learning panels" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "is-active" : undefined}
            data-shortcut={tab.shortcut}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="explanation-panel__content">
        {activeTab === "code" ? (
          <div className="panel-section">
            {codeLines ? (
              <pre className="code-block">
                {codeLines.map((line, index) => (
                  <span
                    className={`code-block__line${index === highlightedLine ? " is-active" : ""}`}
                    key={index}
                  >
                    {line || " "}
                  </span>
                ))}
              </pre>
            ) : (
              <ol className="code-steps">
                {scenarioCommands.map((command, index) => (
                  <li className={index === activeCommandIndex ? "is-active" : undefined} key={`${command.type}-${index}`}>
                    <code>{describeCommand(command)}</code>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}

        {activeTab === "explanation" ? (
          <>
            <div className="panel-section">
              {explanations.length > 0 ? (
                <ul className="plain-list">
                  {explanations.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Watch the canvas: this step changes memory without raising a warning.</p>
              )}
            </div>

            <div className="panel-section">
              <p className="panel-section__label">Diagnostics</p>
              {snapshot.diagnostics.length > 0 ? (
                <ul className="diagnostic-list">
                  {snapshot.diagnostics.map((diagnostic) => (
                    <li className={`diagnostic-list__item severity-${diagnostic.severity}`} key={`${diagnostic.type}-${diagnostic.message}`}>
                      <strong>{diagnostic.type}</strong>
                      <span>{diagnostic.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No diagnostics for this snapshot.</p>
              )}
            </div>

            <div className="panel-section">
              <p className="panel-section__label">Selected</p>
              {selected ? (
                <div className="selected-readout">
                  <strong>{selected.label}</strong>
                  <span>{selected.detail}</span>
                  {selected.valueLabel ? <code>{selected.valueLabel}</code> : null}
                </div>
              ) : (
                <p className="muted">Click a canvas element to inspect it.</p>
              )}
            </div>
          </>
        ) : null}
      </div>

      <div className="explanation-panel__variables-pinned">
        <p className="panel-section__label">Variables</p>
        {hasVariables ? (
          <div className="variable-grid">
            {snapshot.stackFrames.flatMap((frame) =>
              frame.variables.map((variable) => (
                <div className="variable-chip" key={variable.id}>
                  <strong>{variable.name}</strong>
                  <span>{variable.dataType}</span>
                </div>
              ))
            )}
            {snapshot.heapBlocks.map((block) => (
              <div className="variable-chip" key={block.id}>
                <strong>{block.label}</strong>
                <span>{block.allocated ? "allocated" : "freed"} · {block.address}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No live variables yet — step forward to see them appear.</p>
        )}
      </div>
    </aside>
  );
}
