# Usage Guide

## Why Pipeline?

When you need to process data through multiple stages — extract, transform, enrich, export — Pipeline gives you a clean, composable way to organize that work without coupling your logic to a specific storage backend.

| Without Pipeline | With Pipeline |
|-----------------|---------------|
| Steps know about storage | Steps only know about the store interface |
| Hard to test | Swap InMemoryStore for tests |
| Config scattered | Centralized config loading |
| Monolithic code | Composable, single-responsibility steps |

## Core Concepts

**Step** — A unit of work that implements `PipelineItemInterface`. Each step has a name, accepts configuration, and runs against the store.

**Store** — The data layer. Steps read from and write to the store. Implement `PipelineStore` to use any backend.

**Engine** — Orchestrates the pipeline. Register steps, optionally set a parser, and call `run()`.

**Parser** — An optional post-pipeline step that processes the final store contents (e.g., export results, send notifications).

## Custom Store

Implement `PipelineStore` directly or extend `PipelineStoreBase` to get `filter()` and `sortBy()` for free:

```typescript
import { PipelineStoreBase, type PipelineEntry } from '@sdk-e/pipeline';

class PostgresStore extends PipelineStoreBase {
  // implement the abstract methods...
}
```
