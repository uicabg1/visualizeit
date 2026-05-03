# Future Module Expansion Backlog

These modules are part of the VisualizeIT platform vision but are not part of the Memory Engine MVP.

## Module 2: IPv6 And SLAAC Simulator

Goal: visualize IPv6 packet structure and stateless address autoconfiguration.

Core concepts:

- IPv6 header fields.
- Prefix discovery.
- Router advertisement.
- Interface identifier generation.
- SLAAC address formation.
- Duplicate Address Detection.

Recommended rendering:

- Canvas for packet/header breakdowns.
- React Three Fiber only if visualizing network topology adds learning value.

Potential scenarios:

- Host receives router advertisement.
- Host forms global unicast address.
- Packet travels through simplified network path.
- Header fields update during routing.

## Module 3: Discrete Mathematics And Logic

Goal: make set theory and equivalence relations manipulable on screen.

Core concepts:

- Sets and subsets.
- Cartesian products.
- Relations.
- Reflexive, symmetric, transitive properties.
- Equivalence classes.
- Partitions.

Recommended rendering:

- Canvas or SVG for graphs and set diagrams.
- Drag-and-drop nodes.
- Property checker based on pure TypeScript.

Potential scenarios:

- Build a relation manually.
- Toggle edges and see properties update.
- Generate equivalence classes from a relation.
- Compare relation matrix and graph representation.

## Module 4: Explainable AI Tokenization And Embeddings

Goal: explain how text becomes tokens and how embeddings represent semantic relationships.

Core concepts:

- Token boundaries.
- Vocabulary lookup.
- Token IDs.
- Vector embeddings.
- Similarity.
- Attention preview as a future extension.

Recommended rendering:

- 2D token flow for tokenization.
- 3D embedding space with React Three Fiber only after MVP.

Potential scenarios:

- Type a sentence and see token boundaries.
- Compare two words in vector space.
- Show nearest-neighbor relationships.
- Explain why tokenization affects cost and context length.

## Expansion Rule

Do not implement a future module until the Memory Engine MVP has:

- A working route.
- Deterministic simulation.
- A polished visual walkthrough.
- Basic tests.
- Deployment-ready documentation.

