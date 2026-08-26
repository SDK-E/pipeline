import {
  PipelineEngine,
  InMemoryStore,
  type PipelineItemInterface,
  type PipelineParserInterface,
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

class IngestData implements PipelineItemInterface {
  readonly name = 'ingest';

  configure() {}

  async execute(store: PipelineStore): Promise<void> {
    const raw = [
      { id: 'a', title: 'Post A', views: 1200, category: 'tech' },
      { id: 'b', title: 'Post B', views: 300, category: 'life' },
      { id: 'c', title: 'Post C', views: 890, category: 'tech' },
      { id: 'd', title: 'Post D', views: 4500, category: 'tech' },
      { id: 'e', title: 'Post E', views: 150, category: 'life' },
    ];
    for (const r of raw) {
      store.add(entry(r.id, r));
    }
  }
}

class RankByPopularity implements PipelineItemInterface {
  readonly name = 'rank';

  configure() {}

  async execute(store: PipelineStore): Promise<void> {
    const sorted = store.sortBy('id');
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].meta.rank = i + 1;
      store.add(sorted[i]);
    }
  }
}

class CsvParser implements PipelineParserInterface {
  readonly name = 'csv-parser';

  configure() {}

  async parse(store: PipelineStore): Promise<void> {
    const headers = ['id', 'title', 'views', 'category', 'rank'];
    const rows = store.sortBy('id').map((e) => [
      e.id,
      String(e.data.title),
      String(e.data.views),
      String(e.data.category),
      String(e.meta.rank),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    console.log('\n--- CSV Output ---');
    console.log(csv);
    console.log('--- End ---\n');
  }
}

const store = new InMemoryStore();
const engine = new PipelineEngine(store);

engine
  .register(new IngestData())
  .register(new RankByPopularity())
  .useParser(new CsvParser());

await engine.run();
