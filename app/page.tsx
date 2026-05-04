import { getSnapshotSummary } from "@/features/memory-engine/domain/snapshots";
import { explainEvent } from "@/features/memory-engine/pedagogy/explainEvent";
import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";
import { getFinalSnapshot, runMemoryProgram } from "@/features/memory-engine/simulation/memoryEngine";

export default function HomePage() {
  const scenarioSummaries = memoryEngineScenarios.map((scenario) => {
    const snapshots = runMemoryProgram(scenario.commands);
    const finalSnapshot = getFinalSnapshot(snapshots);

    return {
      ...scenario,
      finalSnapshot,
      finalExplanation: explainEvent(finalSnapshot),
      summary: getSnapshotSummary(finalSnapshot)
    };
  });

  return (
    <main style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", padding: 32 }}>
      <h1>VisualizeIT Memory Engine</h1>
      <p>Phase 1 deterministic simulation debug view.</p>

      <section aria-label="Memory scenarios">
        {scenarioSummaries.map((scenario) => (
          <article
            key={scenario.id}
            style={{
              border: "1px solid #d4d4d4",
              marginBlock: 16,
              padding: 16
            }}
          >
            <h2>{scenario.title}</h2>
            <p>{scenario.description}</p>
            <p>{scenario.summary}</p>
            <p>commands={scenario.commands.length}</p>
            <p>heapBlocks={scenario.finalSnapshot.heapBlocks.length}</p>
            <p>diagnostics={scenario.finalSnapshot.diagnostics.map((diagnostic) => diagnostic.type).join(", ") || "none"}</p>
            {scenario.finalExplanation.length > 0 ? (
              <ul>
                {scenario.finalExplanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
