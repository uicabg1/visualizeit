import type { MemoryCommand } from "../domain/commands";

export type MemoryScenario = {
  id: string;
  title: string;
  description: string;
  commands: MemoryCommand[];
};

export const memoryEngineScenarios: MemoryScenario[] = [
  {
    id: "stack-frame-basics",
    title: "Stack Frame Basics",
    description: "Function entry, local declaration, and stack cleanup.",
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      {
        type: "DECLARE_VARIABLE",
        name: "counter",
        dataType: "int",
        initialValue: { kind: "number", value: 42 },
        label: "Declare local int counter"
      },
      { type: "EXIT_FUNCTION", label: "Exit main and release stack frame" }
    ]
  },
  {
    id: "heap-allocation",
    title: "Heap Allocation",
    description: "Pointer declaration, malloc, write, and free.",
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "p", dataType: "int *", label: "Declare pointer p" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "p" },
        size: 4,
        label: "Allocate one int on the heap"
      },
      {
        type: "WRITE_FIELD",
        blockId: "heap-1",
        fieldName: "[0]",
        value: { kind: "number", value: 7 },
        label: "Write value 7 through p"
      },
      { type: "FREE", pointer: { kind: "variable", name: "p" }, label: "Free p" }
    ]
  },
  {
    id: "struct-with-pointer",
    title: "Struct With Pointer",
    description: "Struct fields and pointer field assignment.",
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "node", dataType: "struct Node *", label: "Declare node pointer" },
      { type: "DECLARE_VARIABLE", name: "next", dataType: "struct Node *", label: "Declare next pointer" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "node" },
        size: 16,
        label: "struct Node",
        fields: [
          { name: "value", dataType: "int", value: { kind: "number", value: 1 } },
          { name: "next", dataType: "struct Node *", value: { kind: "pointer", targetBlockId: null } }
        ]
      },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "next" },
        size: 16,
        label: "struct Node",
        fields: [
          { name: "value", dataType: "int", value: { kind: "number", value: 2 } },
          { name: "next", dataType: "struct Node *", value: { kind: "pointer", targetBlockId: null } }
        ]
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "heapField", blockId: "heap-1", fieldName: "next" },
        source: { kind: "heapBlock", blockId: "heap-2" },
        label: "Connect node.next to next"
      }
    ]
  },
  {
    id: "leak-and-dangling-pointer",
    title: "Leak And Dangling Pointer",
    description: "Lost heap reference and pointer to released memory.",
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "leaked", dataType: "int *", label: "Declare leaked pointer" },
      { type: "DECLARE_VARIABLE", name: "dangling", dataType: "int *", label: "Declare dangling pointer" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "leaked" },
        size: 4,
        label: "Leaked int"
      },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "dangling" },
        size: 4,
        label: "Dangling int"
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "leaked" },
        source: { kind: "null" },
        label: "Lose the only pointer to leaked int"
      },
      { type: "FREE", pointer: { kind: "variable", name: "dangling" }, label: "Free dangling int" },
      { type: "READ_VALUE", source: { kind: "variable", name: "dangling" }, label: "Read through dangling pointer" },
      { type: "FREE", pointer: { kind: "variable", name: "dangling" }, label: "Free dangling int again" }
    ]
  }
];

