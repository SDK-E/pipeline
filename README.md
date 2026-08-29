<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="branding/pipeline-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="branding/pipeline-logo-light.svg">
    <img src="branding/pipeline-logo-light.svg" alt="Pipeline" width="200">
  </picture>
</p>

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

## Install

```bash
npm install @sdk-e/pipeline
```

## Quick Start

```typescript
import { PipelineEngine, InMemoryStore, type PipelineItemInterface } from '@sdk-e/pipeline';

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

const engine = new PipelineEngine(new InMemoryStore());
engine.register(new FetchData());
await engine.run();
```

## Documentation

| Guide | Description |
|-------|-------------|
| [docs/usage.md](docs/usage.md) | Core concepts, why Pipeline, custom stores |
| [docs/api.md](docs/api.md) | Full API reference |
| [docs/examples.md](docs/examples.md) | Code examples and patterns |

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built with by <a href="https://sdk.enterprises">SDK Enterprises</a></sub>
</p>
