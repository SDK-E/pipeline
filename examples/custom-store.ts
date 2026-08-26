import {
  PipelineEngine,
  PipelineStoreBase,
  SilentLogger,
  type PipelineItemInterface,
  type PipelineStore,
  type PipelineEntry,
} from '@sdk-e/pipeline';

function entry(id: string, source: string, data: Record<string, unknown>): PipelineEntry {
  return {
    id,
    source,
    data,
    tags: [],
    meta: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

class StepA implements PipelineItemInterface {
  readonly name = 'step-a';
  configure() {}
  async execute(store: PipelineStore): Promise<void> {
    store.add(entry('1', 'step-a', { origin: 'A' }));
    store.add(entry('2', 'step-a', { origin: 'A' }));
  }
}

class StepB implements PipelineItemInterface {
  readonly name = 'step-b';
  configure() {}
  async execute(store: PipelineStore): Promise<void> {
    const items = store.filter((e) => e.source === 'step-a');
    for (const e of items) {
      e.data.touchedBy = 'B';
      store.add(e);
    }
  }
}

class CustomStore extends PipelineStoreBase {
  #log: string[] = [];
  #inner = new Map<string, PipelineEntry>();

  add(entry: PipelineEntry): void {
    this.#log.push(`add:${entry.id}`);
    this.#inner.set(entry.id, entry);
  }
  remove(id: string): void {
    this.#log.push(`remove:${id}`);
    this.#inner.delete(id);
  }
  get(id: string): PipelineEntry | undefined {
    return this.#inner.get(id);
  }
  all(): PipelineEntry[] {
    return [...this.#inner.values()];
  }
  count(): number {
    return this.#inner.size;
  }
  close(): void {
    this.#inner.clear();
  }

  getLog(): string[] {
    return [...this.#log];
  }
}

const store = new CustomStore();
const engine = new PipelineEngine(store, { logger: new SilentLogger() });

engine.register(new StepA()).register(new StepB());
await engine.run();

console.log('Custom store operation log:');
for (const op of store.getLog()) {
  console.log(`  ${op}`);
}
console.log(`\nFinal entries: ${store.count()}`);
for (const e of store.all()) {
  console.log(`  ${e.id}: ${JSON.stringify(e.data)}`);
}
