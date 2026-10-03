import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { memoryEngineScenarios } from "@/features/memory-engine/simulation/fixtures";

export function useUrlState() {
  const searchParams = useSearchParams();

  const firstScenarioId = memoryEngineScenarios[0]?.id ?? "";
  const urlScenarioId = searchParams.get("scenario");
  const urlStep = parseInt(searchParams.get("step") ?? "", 10);
  const initialScenarioId = memoryEngineScenarios.find((s) => s.id === urlScenarioId)?.id ?? firstScenarioId;
  const initialStep = !isNaN(urlStep) && urlStep >= 0 ? urlStep : 0;

  const [scenarioId, setScenarioId] = useState(initialScenarioId);
  const [stepIndex, setStepIndex] = useState(initialStep);

  return { initialStep, scenarioId, setScenarioId, stepIndex, setStepIndex };
}

export function useUrlSync(scenarioId: string, activeStepIndex: number) {
  const router = useRouter();
  const firstScenarioId = memoryEngineScenarios[0]?.id ?? "";

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = new URLSearchParams(window.location.search);
      const currentScenario = current.get("scenario") ?? firstScenarioId;
      const parsedStep = parseInt(current.get("step") ?? "", 10);
      const currentStep = isNaN(parsedStep) || parsedStep < 0 ? 0 : parsedStep;
      if (currentScenario === scenarioId && currentStep === activeStepIndex) return;
      const params = new URLSearchParams({ scenario: scenarioId, step: String(activeStepIndex) });
      router.replace(`/?${params.toString()}`);
    }, 150);
    return () => clearTimeout(timer);
  }, [scenarioId, activeStepIndex, firstScenarioId, router]);
}
