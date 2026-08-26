import { randomUUID } from 'node:crypto';
import type { PipelineItemInterface } from '@sdk-e/pipeline';
import type { PipelineParserInterface } from '@sdk-e/pipeline';
import type { PipelineStore } from '@sdk-e/pipeline';
import { DefaultLogger, type PipelineLogger } from '@sdk-e/pipeline';

interface RegisteredStep {
  item: PipelineItemInterface;
  config: Record<string, unknown>;
}

export interface PipelineEngineOptions {
  id?: string;
  name?: string;
  logger?: PipelineLogger;
}

export class PipelineEngine {
  #id: string;
  #name: string;
  #steps: RegisteredStep[] = [];
  #parser?: PipelineParserInterface;
  #store: PipelineStore;
  #logger: PipelineLogger;

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  constructor(store: PipelineStore, options?: PipelineEngineOptions) {
    this.#store = store;
    this.#logger = options?.logger ?? new DefaultLogger();
    this.#id = options?.id ?? randomUUID();
    this.#name = options?.name ?? 'pipeline';
  }

  register(item: PipelineItemInterface, config: Record<string, unknown> = {}): this {
    item.configure(config, this.#logger);
    this.#steps.push({ item, config });
    return this;
  }

  useParser(parser: PipelineParserInterface): this {
    parser.configure(this.#logger);
    this.#parser = parser;
    return this;
  }

  async run(): Promise<void> {
    const label = `${this.#name}(${this.#id.slice(0, 8)})`;
    this.#logger.info(`[${label}] starting with ${this.#steps.length} step(s)`);

    for (const { item } of this.#steps) {
      this.#logger.info(`[${label}] running step: ${item.name}`);
      await item.execute(this.#store);
      this.#logger.info(`[${label}] ${item.name} done — ${this.#store.count()} rows`);
    }

    if (this.#parser) {
      this.#logger.info(`[${label}] parsing with: ${this.#parser.name}`);
      await this.#parser.parse(this.#store);
    }

    this.#logger.info(`[${label}] complete`);
  }
}
