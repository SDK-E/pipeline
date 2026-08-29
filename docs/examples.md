# Examples

## Chaining Multiple Steps

```typescript
import { PipelineEngine, TableStore } from '@sdk-e/pipeline';

const engine = new PipelineEngine(new TableStore());

engine
  .register(new ExtractStep())
  .register(new TransformStep(), { format: 'json' })
  .register(new LoadStep(), { destination: 'database' })
  .useParser(new ExportParser());

await engine.run();
```

## Using Config Files

```typescript
import { PipelineEngine, InMemoryStore, ConfigLoader } from '@sdk-e/pipeline';

const loader = new ConfigLoader('./config/pipeline');
const engine = new PipelineEngine(new InMemoryStore());

const extractConfig = await loader.load<ExtractConfig>('extract');
const transformConfig = await loader.load<TransformConfig>('transform');

engine
  .register(new ExtractStep(), extractConfig)
  .register(new TransformStep(), transformConfig);

await engine.run();
```

## Custom Step Implementation

```typescript
import { type PipelineItemInterface, type PipelineStore } from '@sdk-e/pipeline';

interface FetchConfig {
  url?: string;
  retries?: number;
}

class FetchData implements PipelineItemInterface<FetchConfig> {
  readonly name = 'fetch-data';
  private url = 'https://api.example.com/data';
  private retries = 3;

  configure(config: FetchConfig) {
    this.url = config.url ?? this.url;
    this.retries = config.retries ?? this.retries;
  }

  async execute(store: PipelineStore): Promise<void> {
    const response = await fetch(this.url);
    const items = await response.json();
    
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
```

## Custom Store Implementation

```typescript
import { PipelineStoreBase, type PipelineEntry } from '@sdk-e/pipeline';

class PostgresStore extends PipelineStoreBase {
  private client: PostgresClient;

  constructor(connectionString: string) {
    super();
    this.client = new PostgresClient(connectionString);
  }

  add(entry: PipelineEntry): void {
    this.client.query(
      'INSERT INTO pipeline_entries (id, source, data, tags, meta, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [entry.id, entry.source, entry.data, entry.tags, entry.meta, entry.createdAt, entry.updatedAt]
    );
  }

  remove(id: string): void {
    this.client.query('DELETE FROM pipeline_entries WHERE id = $1', [id]);
  }

  get(id: string): PipelineEntry | undefined {
    const result = this.client.query('SELECT * FROM pipeline_entries WHERE id = $1', [id]);
    return result.rows[0];
  }

  all(): PipelineEntry[] {
    const result = this.client.query('SELECT * FROM pipeline_entries');
    return result.rows;
  }

  count(): number {
    const result = this.client.query('SELECT COUNT(*) FROM pipeline_entries');
    return parseInt(result.rows[0].count);
  }

  close(): void {
    this.client.end();
  }
}
```

## Using a Parser

```typescript
import { type PipelineParserInterface, type PipelineStore } from '@sdk-e/pipeline';

class ExportParser implements PipelineParserInterface {
  readonly name = 'export-parser';

  async parse(store: PipelineStore): Promise<void> {
    const entries = store.all();
    const json = JSON.stringify(entries, null, 2);
    await fs.writeFile('./output.json', json);
    console.log(`Exported ${entries.length} entries`);
  }
}
```
