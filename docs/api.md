# API Reference

## `PipelineEngine`

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

## `PipelineStore` (interface)

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

## Built-in Stores

| Store | Description | Use Case |
|-------|-------------|----------|
| `InMemoryStore` | Map-backed storage with fast lookups | Testing, small datasets |
| `TableStore` | Ordered storage that preserves insertion order | Production workloads |

Both extend `PipelineStoreBase` which provides `filter()` and `sortBy()` for free.

```typescript
const memoryStore = new InMemoryStore();
const tableStore = new TableStore();
```

## `PipelineEntry`

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

## `PipelineItemInterface`

Every step implements this interface.

```typescript
interface PipelineItemInterface<TConfig = Record<string, unknown>> {
  readonly name: string;
  configure(config: TConfig): void;
  execute(store: PipelineStore): Promise<void>;
}
```

## `PipelineParserInterface`

The post-pipeline consumer that processes final results.

```typescript
interface PipelineParserInterface {
  readonly name: string;
  parse(store: PipelineStore): Promise<void>;
}
```

## `ConfigLoader`

Loads per-step JSON configuration from disk.

```typescript
const loader = new ConfigLoader('./config/steps');
const config = await loader.load<MyConfig>('my-step');
// reads ./config/steps/my-step.json, returns {} if missing
```
