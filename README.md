<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/pipeline-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="branding/pipeline-logo-light.svg">
    <img src="branding/pipeline-logo-light.svg" alt="Pipeline" width="200">
  </picture>
</p>

<h1 align="center">Pipeline</h1>

<p align="center">
  <strong>Pluggable pipeline engine for splitting work into sequential steps backed by interchangeable stores</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@sdk-e/pipeline"><img src="https://img.shields.io/npm/v/@sdk-e/pipeline?style=flat-square&logo=npm" alt="npm version"></a>
  <a href="https://github.com/SDK-E/pipeline/actions"><img src="https://img.shields.io/github/actions/workflow/status/SDK-E/pipeline/ci.yml?style=flat-square&logo=github" alt="CI Status"></a>
  <a href="https://github.com/SDK-E/pipeline/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square&logo=typescript" alt="TypeScript">
</p>

---

## Features

- **Pluggable Architecture** — Write steps as standalone classes implementing a simple interface
- **Interchangeable Stores** — Swap storage backends without changing pipeline logic
- **Type-Safe** — Full TypeScript support with generic config types
- **Zero Dependencies** — Lightweight core with no runtime dependencies
- **Built-in Stores** — InMemory for testing, TableStore for production workloads
- **Config Loading** — Load per-step JSON configuration from disk
- **Structured Logging** — Built-in logger with silent mode for tests

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Why Pipeline?](#why-pipeline)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [PipelineEngine](#pipelineengine)
  - [PipelineStore](#pipelinestore-interface)
  - [Built-in Stores](#built-in-stores)
  - [PipelineEntry](#pipelineentry)
  - [PipelineItemInterface](#pipelineiteminterface)
  - [PipelineParserInterface](#pipelineparserinterface)
  - [ConfigLoader](#configloader)
- [Custom Store](#custom-store)
- [Examples](#examples)
- [License](#license)

## Install

```bash
npm install @sdk-e/pipeline
```

## Quick Start

```typescript
import {
  PipelineEngine,
  InMemoryStore,
  type PipelineItemInterface,
  type PipelineStore,
} from '@sdk-e/pipeline';

class FetchData implements PipelineItemInterface {
  readonly name = 'fetch-data';

  configure() {}

  async execute(store: PipelineStore): Promise<void> {
    const items = await fetch('https://api.example.com/data').then((r) => r.json());
    for (const item of items) {
      store.add({
        id: item.id,
        source: 'api',
        data: item,
        tags: [],
        meta: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

class EnrichData implements PipelineItemInterface<{ batchSize?: number }> {
  readonly name = 'enrich-data';
  private batchSize = 100;

  configure(config: { batchSize?: number }) {
    this.batchSize = config.batchSize ?? 100;
  }

  async execute(store: PipelineStore): Promise<void> {
    for (const entry of store.all()) {
      entry.meta.enriched = true;
      store.add(entry);
    }
  }
}

const store = new InMemoryStore();
const engine = new PipelineEngine(store);

engine
  .register(new FetchData())
  .register(new EnrichData(), { batchSize: 50 });

await engine.run();
console.log(`Pipeline complete: ${store.count()} entries`);
```

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

## API Reference

### `PipelineEngine`

The orchestrator that chains steps together and runs them sequentially.

```typescript
const engine = new PipelineEngine(store);
engine
  .register(stepA, configA)  // calls stepA.configure(configA)
  .register(stepB)
  .useParser(myParser);
await engine.run();
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `register` | `item: PipelineItemInterface, config?: TConfig` | Add a step. Calls `item.configure(config)` immediately. Returns `this` for chaining. |
| `useParser` | `parser: PipelineParserInterface` | Set the post-pipeline parser. Returns `this` for chaining. |
| `run` | `()` | Execute all steps sequentially, then the parser. Returns `Promise<void>`. |

### `PipelineStore` (interface)

The storage contract. Implement this for custom backends.

```typescript
interface PipelineStore {
  add(entry: PipelineEntry): void;
  remove(id: string): void;
  get(id: string): PipelineEntry | undefined;
  all(): PipelineEntry[];
  count(): number;
  close(): void;
}
```

### Built-in Stores

| Store | Description | Use Case |
|-------|-------------|----------|
| `InMemoryStore` | Map-backed storage with fast lookups | Testing, small datasets |
| `TableStore` | Ordered storage that preserves insertion order | Production workloads |

Both extend `PipelineStoreBase` which provides `filter()` and `sortBy()` for free.

```typescript
const memoryStore = new InMemoryStore();
const tableStore = new TableStore();
```

### `PipelineEntry`

The data structure stored in the pipeline.

```typescript
interface PipelineEntry {
  id: string;
  source: string;
  data: Record<string, unknown>;
  tags: string[];
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### `PipelineItemInterface`

Every step implements this interface.

```typescript
interface PipelineItemInterface<TConfig = Record<string, unknown>> {
  readonly name: string;
  configure(config: TConfig): void;
  execute(store: PipelineStore): Promise<void>;
}
```

### `PipelineParserInterface`

The post-pipeline consumer that processes final results.

```typescript
interface PipelineParserInterface {
  readonly name: string;
  parse(store: PipelineStore): Promise<void>;
}
```

### `ConfigLoader`

Loads per-step JSON configuration from disk.

```typescript
const loader = new ConfigLoader('./config/steps');
const config = await loader.load<MyConfig>('my-step');
// reads ./config/steps/my-step.json, returns {} if missing
```

## Custom Store

Implement `PipelineStore` directly or extend `PipelineStoreBase` to get `filter()` and `sortBy()` for free:

```typescript
import { PipelineStoreBase, type PipelineEntry } from '@sdk-e/pipeline';

class PostgresStore extends PipelineStoreBase {
  // implement the abstract methods...
}
```

## Examples

### Chaining Multiple Steps

```typescript
const engine = new PipelineEngine(new TableStore());

engine
  .register(new ExtractStep())
  .register(new TransformStep(), { format: 'json' })
  .register(new LoadStep(), { destination: 'database' })
  .useParser(new ExportParser());

await engine.run();
```

### Using Config Files

```typescript
const loader = new ConfigLoader('./config/pipeline');
const engine = new PipelineEngine(store);

const extractConfig = await loader.load<ExtractConfig>('extract');
const transformConfig = await loader.load<TransformConfig>('transform');

engine
  .register(new ExtractStep(), extractConfig)
  .register(new TransformStep(), transformConfig);
```

---

<p align="center">
  <sub>Built with by <a href="https://github.com/SDK-E">SDK Enterprises</a></sub>
</p>

## License

[MIT](LICENSE)
