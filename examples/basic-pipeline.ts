import {
  PipelineEngine,
  InMemoryStore,
  type PipelineItemInterface,
  type PipelineLogger,
  type PipelineStore,
  type PipelineEntry,
} from '@sdk-e/pipeline';

function entry(id: string, data: Record<string, unknown>): PipelineEntry {
  return {
    id,
    source: 'example',
    data,
    tags: [],
    meta: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

class FetchItems implements PipelineItemInterface {
  readonly name = 'fetch-items';

  configure() {}

  async execute(store: PipelineStore): Promise<void> {
    const items = [
      { id: '1', name: 'Alice', score: 85 },
      { id: '2', name: 'Bob', score: 42 },
      { id: '3', name: 'Charlie', score: 91 },
      { id: '4', name: 'Diana', score: 67 },
    ];

    for (const item of items) {
      store.add(entry(item.id, item));
    }
  }
}

class FilterPassing implements PipelineItemInterface {
  readonly name = 'filter-passing';
  private threshold = 60;
  private logger!: PipelineLogger;

  configure(config: { threshold?: number }, logger: PipelineLogger) {
    this.threshold = config.threshold ?? 60;
    this.logger = logger;
  }

  async execute(store: PipelineStore): Promise<void> {
    const failing = store.filter((e) => (e.data.score as number) < this.threshold);
    this.logger.info(`removing ${failing.length} entry(ies) below threshold ${this.threshold}`);
    for (const e of failing) {
      store.remove(e.id);
    }
  }
}

class TagResults implements PipelineItemInterface {
  readonly name = 'tag-results';

  configure() {}

  async execute(store: PipelineStore): Promise<void> {
    for (const e of store.all()) {
      const score = e.data.score as number;
      e.tags.push(score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'average');
      e.meta.processed = true;
      store.add(e);
    }
  }
}

const store = new InMemoryStore();
const engine = new PipelineEngine(store);

engine
  .register(new FetchItems())
  .register(new FilterPassing(), { threshold: 60 })
  .register(new TagResults());

await engine.run();

console.log(`\nResults: ${store.count()} entries\n`);
for (const e of store.all()) {
  console.log(`  ${e.id}: ${e.data.name} (score: ${e.data.score}) [${e.tags.join(', ')}]`);
}
