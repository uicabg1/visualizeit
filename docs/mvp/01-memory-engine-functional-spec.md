# Low-Level Memory Engine Functional Spec

## Product Goal

Build an interactive visualizer that teaches how C memory works by turning memory operations into a step-by-step, inspectable, replayable visual experience.

The MVP should demonstrate engineering depth through deterministic simulation, clear rendering boundaries, and performance-aware client architecture.

## Primary Audience

- Technical recruiters and corporate freelance clients evaluating engineering maturity.
- Students learning low-level programming concepts.
- Developers who want a visual explanation of C memory behavior.

## MVP Learning Outcomes

After using the MVP, a user should understand:

- The difference between stack and heap memory.
- How function calls create and remove stack frames.
- How `malloc` allocates heap memory.
- How `free` marks heap memory as released.
- Why dangling pointers and memory leaks happen.
- How structs and pointers occupy memory.
- Why fragmentation can occur over time.

## Core User Experience

The first screen should open directly into the memory visualizer, not a marketing landing page.

Main regions:

- Memory canvas.
- Operation timeline.
- Code or pseudo-code panel.
- Explanation panel.
- Controls for step, rewind, play, reset, and scenario selection.
- Inspector for selected variables, heap blocks, and pointers.

## Required MVP Scenarios

### Scenario 1: Stack Frame Basics

Demonstrates:

- Function entry.
- Local variable declaration.
- Function exit.
- Stack frame cleanup.

### Scenario 2: Heap Allocation

Demonstrates:

- Pointer declaration.
- `malloc` allocation.
- Pointer assignment.
- Value write.
- `free` operation.

### Scenario 3: Struct With Pointer

Demonstrates:

- Struct fields.
- Pointer field assignment.
- Heap block connected to a struct.
- Object-like memory layout in C.

### Scenario 4: Leak And Dangling Pointer

Demonstrates:

- Lost reference to allocated memory.
- Freed memory still referenced by a pointer.
- Diagnostics and warnings.

## Interaction Requirements

- Step forward and backward through operations.
- Play and pause a scenario.
- Scrub the timeline.
- Select a memory block, variable, pointer, or struct field.
- See explanation text update based on selected state.
- Reset scenario to initial state.

## Diagnostics

The engine should detect and explain:

- Memory leak.
- Dangling pointer.
- Double free.
- Null pointer dereference.
- Use after free.
- Heap fragmentation warning.

Diagnostics should be educational, not alarmist. Each diagnostic should answer:

- What happened?
- Why does it matter?
- Which visual element shows the issue?
- What would a safer version do?

## Non-Goals For MVP

- Full C parser.
- Full compiler or debugger.
- Real process memory inspection.
- User-submitted arbitrary C execution.
- 3D memory visualization.
- Multiplayer or accounts.
- Production LLM tutoring.

## MVP Definition Of Done

The MVP is complete when:

- Four guided scenarios are implemented.
- Timeline replay is deterministic.
- Core simulation transitions are tested.
- Canvas rendering supports stack, heap, pointers, structs, and diagnostics.
- The app runs locally and can be deployed as a portfolio demo.
- The README explains the architecture and technical value clearly.

