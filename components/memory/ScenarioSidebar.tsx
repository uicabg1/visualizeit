"use client";

import { useMemo, useState } from "react";

import type {
  MemoryScenario,
  MemoryScenarioCategory
} from "@/features/memory-engine/simulation/fixtures";

const categoryOrder: MemoryScenarioCategory[] = [
  "Fundamentals",
  "Data Structures",
  "Bugs & Pitfalls"
];

type ScenarioSidebarProps = {
  scenarios: MemoryScenario[];
  selectedScenarioId: string;
  onScenarioChange: (scenarioId: string) => void;
};

function IconSearch() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

export function ScenarioSidebar({
  scenarios,
  selectedScenarioId,
  onScenarioChange
}: ScenarioSidebarProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return categoryOrder
      .map((category) => {
        const items = scenarios.filter((scenario) => {
          if (scenario.category !== category) {
            return false;
          }
          if (!trimmed) {
            return true;
          }
          return scenario.title.toLowerCase().includes(trimmed);
        });
        return { category, items };
      })
      .filter((group) => group.items.length > 0);
  }, [query, scenarios]);

  return (
    <aside className="scenario-sidebar" aria-label="Scenarios">
      <div className="scenario-sidebar__search">
        <IconSearch />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search algorithms…"
          aria-label="Search scenarios"
        />
        <span className="scenario-sidebar__shortcut" aria-hidden="true">/</span>
      </div>

      <nav className="scenario-sidebar__groups" aria-label="Scenarios by category">
        {groups.map((group) => (
          <section key={group.category} className="scenario-sidebar__group">
            <header className="scenario-sidebar__group-header">
              <span className="scenario-sidebar__group-label">{group.category}</span>
              <span className="scenario-sidebar__group-count">{group.items.length}</span>
            </header>
            <ul className="scenario-sidebar__list">
              {group.items.map((scenario) => {
                const isActive = scenario.id === selectedScenarioId;
                return (
                  <li key={scenario.id}>
                    <button
                      type="button"
                      className={`scenario-sidebar__item${isActive ? " is-active" : ""}`}
                      onClick={() => onScenarioChange(scenario.id)}
                      aria-current={isActive ? "true" : undefined}
                    >
                      {scenario.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <footer className="scenario-sidebar__footer">
        {scenarios.length} algorithms · by visualizeit
      </footer>
    </aside>
  );
}
