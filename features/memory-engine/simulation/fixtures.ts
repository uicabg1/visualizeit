import type { MemoryCommand } from "../domain/commands";

export type MemoryScenarioCategory =
  | "Fundamentals"
  | "Data Structures"
  | "Bugs & Pitfalls";

export type MemoryScenario = {
  id: string;
  title: string;
  category: MemoryScenarioCategory;
  description: string;
  commands: MemoryCommand[];
  regions?: { stack?: boolean; heap?: boolean };
  codeLines?: string[];
  stepToLine?: number[]; // length === commands.length; maps command index → codeLines index
};

export const memoryEngineScenarios: MemoryScenario[] = [
  {
    id: "stack-frame-basics",
    title: "Stack Frames",
    category: "Fundamentals",
    description: "Function entry, local declaration, and stack cleanup.",
    regions: { stack: true, heap: false },
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      {
        type: "DECLARE_VARIABLE",
        name: "counter",
        dataType: "int",
        initialValue: { kind: "number", value: 42 },
        label: "Declare local int counter"
      },
      { type: "EXIT_FUNCTION", label: "Exit main — locals released, frame ghosted for reference." }
    ],
    codeLines: [
      "int main() {",
      "    int counter = 42;",
      "    return 0;",
      "}",
    ],
    stepToLine: [0, 1, 3]
  },
  {
    id: "heap-allocation",
    title: "Heap Blocks",
    category: "Fundamentals",
    regions: { stack: true, heap: true },
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
    ],
    codeLines: [
      "int main() {",
      "    int *p;",
      "    p = malloc(4);",
      "    *p = 7;",
      "    free(p);",
      "}",
    ],
    stepToLine: [0, 1, 2, 3, 4]
  },
  {
    id: "struct-with-pointer",
    title: "Struct With Pointer",
    category: "Data Structures",
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
    ],
    codeLines: [
      "struct Node {",
      "    int value; struct Node *next;",
      "};",
      "",
      "int main() {",
      "    struct Node *node;",
      "    struct Node *next;",
      "    node = malloc(sizeof(struct Node));",
      "    next = malloc(sizeof(struct Node));",
      "    node->next = next;",
      "}",
    ],
    stepToLine: [4, 5, 6, 7, 8, 9]
  },
  {
    id: "recursive-stack",
    title: "Recursive Stack",
    category: "Fundamentals",
    description: "factorial(3) call chain: frame accumulation, peak depth, and unwind.",
    regions: { stack: true, heap: false },
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(3)" },
      {
        type: "DECLARE_VARIABLE",
        name: "n",
        dataType: "int",
        initialValue: { kind: "number", value: 3 },
        label: "Local n = 3"
      },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(2)" },
      {
        type: "DECLARE_VARIABLE",
        name: "n",
        dataType: "int",
        initialValue: { kind: "number", value: 2 },
        label: "Local n = 2"
      },
      { type: "ENTER_FUNCTION", functionName: "factorial", label: "Call factorial(1) — base case" },
      {
        type: "DECLARE_VARIABLE",
        name: "n",
        dataType: "int",
        initialValue: { kind: "number", value: 1 },
        label: "Local n = 1"
      },
      { type: "EXIT_FUNCTION", label: "factorial(1) returns 1" },
      { type: "EXIT_FUNCTION", label: "factorial(2) returns 2" },
      { type: "EXIT_FUNCTION", label: "factorial(3) returns 6" },
      { type: "EXIT_FUNCTION", label: "Exit main" }
    ],
    codeLines: [
      "int factorial(int n) {",
      "    if (n <= 1) return 1;",
      "    return n * factorial(n - 1);",
      "}",
      "",
      "int main() {",
      "    factorial(3);",
      "}",
    ],
    stepToLine: [5, 0, 0, 2, 0, 1, 0, 1, 2, 2, 7]
  },
  {
    id: "pointer-arithmetic",
    title: "Pointer Arithmetic",
    category: "Fundamentals",
    description: "Allocate an int array, write elements, advance a pointer through elements, then free.",
    regions: { stack: true, heap: true },
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "arr", dataType: "int *", label: "Declare arr pointer" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "arr" },
        size: 12,
        label: "int[3]",
        fields: [
          { name: "[0]", dataType: "int", value: { kind: "number", value: 0 } },
          { name: "[1]", dataType: "int", value: { kind: "number", value: 0 } },
          { name: "[2]", dataType: "int", value: { kind: "number", value: 0 } }
        ]
      },
      {
        type: "WRITE_FIELD",
        blockId: "heap-1",
        fieldName: "[0]",
        value: { kind: "number", value: 10 },
        label: "arr[0] = 10"
      },
      {
        type: "WRITE_FIELD",
        blockId: "heap-1",
        fieldName: "[1]",
        value: { kind: "number", value: 20 },
        label: "arr[1] = 20"
      },
      {
        type: "WRITE_FIELD",
        blockId: "heap-1",
        fieldName: "[2]",
        value: { kind: "number", value: 30 },
        label: "arr[2] = 30"
      },
      {
        type: "DECLARE_VARIABLE",
        name: "ptr",
        dataType: "int *",
        initialValue: { kind: "pointer", targetBlockId: "heap-1" },
        label: "int *ptr = arr — ptr points to arr[0]"
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "ptr" },
        source: { kind: "heapBlock", blockId: "heap-1" },
        label: "ptr = arr + 1 — advances ptr to second element"
      },
      {
        type: "READ_VALUE",
        source: { kind: "variable", name: "ptr" },
        label: "Read *ptr — dereferences arr[1] = 20"
      },
      { type: "FREE", pointer: { kind: "variable", name: "arr" }, label: "free(arr) — release the array" },
      { type: "EXIT_FUNCTION", label: "Exit main" }
    ],
    codeLines: [
      "int main() {",
      "    int *arr;",
      "    arr = malloc(12);",
      "    arr[0] = 10;",
      "    arr[1] = 20;",
      "    arr[2] = 30;",
      "    int *ptr = arr;",
      "    ptr = arr + 1;",
      "    *ptr;",
      "    free(arr);",
      "}"
    ],
    stepToLine: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  {
    id: "linked-list-traversal",
    title: "Linked List Traversal",
    category: "Data Structures",
    description: "Build a two-node singly-linked list and traverse it with a moving pointer.",
    regions: { stack: true, heap: true },
    commands: [
      { type: "ENTER_FUNCTION", functionName: "main", label: "Enter main" },
      { type: "DECLARE_VARIABLE", name: "head", dataType: "struct Node *", label: "Declare head pointer" },
      { type: "DECLARE_VARIABLE", name: "curr", dataType: "struct Node *", label: "Declare curr pointer" },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "head" },
        size: 16,
        label: "struct Node",
        fields: [
          { name: "value", dataType: "int", value: { kind: "number", value: 1 } },
          { name: "next", dataType: "struct Node *", value: { kind: "pointer", targetBlockId: null } }
        ]
      },
      {
        type: "MALLOC",
        target: { kind: "variable", name: "curr" },
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
        label: "head->next = curr — link first node to second"
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "curr" },
        source: { kind: "heapBlock", blockId: "heap-1" },
        label: "curr = head — start traversal at head"
      },
      {
        type: "READ_VALUE",
        source: { kind: "variable", name: "curr" },
        label: "Read curr->value — node 1 has value 1"
      },
      {
        type: "ASSIGN_POINTER",
        target: { kind: "variable", name: "curr" },
        source: { kind: "heapBlock", blockId: "heap-2" },
        label: "curr = curr->next — advance to second node"
      },
      {
        type: "READ_VALUE",
        source: { kind: "variable", name: "curr" },
        label: "Read curr->value — node 2 has value 2"
      },
      { type: "FREE", pointer: { kind: "variable", name: "curr" }, label: "free(curr) — release second node" },
      { type: "FREE", pointer: { kind: "variable", name: "head" }, label: "free(head) — release first node" },
      { type: "EXIT_FUNCTION", label: "Exit main" }
    ],
    codeLines: [
      "struct Node {",
      "    int value;",
      "    struct Node *next;",
      "};",
      "",
      "int main() {",
      "    struct Node *head;",
      "    struct Node *curr;",
      "    head = malloc(sizeof(struct Node));",
      "    curr = malloc(sizeof(struct Node));",
      "    head->next = curr;",
      "    curr = head;",
      "    head->value;",
      "    curr = curr->next;",
      "    curr->value;",
      "    free(curr);",
      "    free(head);",
      "}",
    ],
    stepToLine: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  {
    id: "leak-and-dangling-pointer",
    title: "Leak And Dangling Pointer",
    category: "Bugs & Pitfalls",
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
    ],
    codeLines: [
      "int main() {",
      "    int *leaked;",
      "    int *dangling;",
      "    leaked = malloc(4);",
      "    dangling = malloc(4);",
      "    leaked = NULL;",
      "    free(dangling);",
      "    *dangling;",
      "    free(dangling);",
      "}",
    ],
    stepToLine: [0, 1, 2, 3, 4, 5, 6, 7, 8]
  }
];

