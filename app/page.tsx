import { Suspense } from "react";
import { MemoryWorkspace } from "@/components/memory/MemoryWorkspace";

export default function HomePage() {
  return (
    <Suspense>
      <MemoryWorkspace />
    </Suspense>
  );
}
