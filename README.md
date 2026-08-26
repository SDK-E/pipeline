# sdk-e-pipeline

Pluggable pipeline engine for splitting work into sequential steps backed by interchangeable stores.

## Install

```bash
npm install sdk-e-pipeline
```

## Quick Start

```ts
import {
  PipelineEngine,
  InMemoryStore,
  type PipelineItemInterface,
  type PipelineStore,
} from 'sdk-e-pipeline';

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

class EnrichData implements PipelineItemInterface {
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

## API

### `PipelineEngine`

The orchestrator. Chains steps together and runs them sequentially.

```ts
const engine = new PipelineEngine(store);
engine
  .register(stepA, configA)  // calls stepA.configure(configA)
  .register(stepB)
  .useParser(myParser);
await engine.run();
```

| Method | Description |
|---|---|
| `register(item, config?)` | Add a step. Calls `item.configure(config)` immediately. |
| `useParser(parser)` | Set the post-pipeline parser (runs after all steps). |
| `run()` | Execute all steps sequentially, then the parser. |

### `PipelineStore` (interface)

The storage contract. Implement this for custom backends.

```ts
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

| Store | Description |
|---|---|
| `InMemoryStore` | Map-backed, fast lookups, good for tests |
| `TableStore` | Ordered, preserves insertion order, production-oriented |

Both extend `PipelineStoreBase` which provides `filter()` and `sortBy()` for free.

### `PipelineEntry`

```ts
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

Every step implements this.

```ts
interface PipelineItemInterface<TConfig = Record<string, unknown>> {
  readonly name: string;
  configure(config: TConfig): void;
  execute(store: PipelineStore): Promise<void>;
}
```

### `PipelineParserInterface`

The post-pipeline consumer.

```ts
interface PipelineParserInterface {
  readonly name: string;
  parse(store: PipelineStore): Promise<void>;
}
```

### `ConfigLoader`

Loads per-step JSON config from disk.

```ts
const loader = new ConfigLoader('./config/steps');
const config = await loader.load<MyConfig>('my-step');
// reads ./config/steps/my-step.json, returns {} if missing
```

## Custom Store

Implement `PipelineStore` or extend `PipelineStoreBase`:

```ts
import { PipelineStoreBase, type PipelineEntry } from 'sdk-e-pipeline';

class PostgresStore extends PipelineStoreBase {
  // implement the abstract methods...
}
```

## License

MIT
