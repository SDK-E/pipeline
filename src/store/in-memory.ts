import type { PipelineEntry } from '@sdk-e/pipeline';
import { PipelineStoreBase } from '@sdk-e/pipeline';

/**
 * Map-backed store. Fast lookups by id, zero dependencies.
 * Good for tests, lightweight pipelines, and anything that doesn't
 * need persistence or ordered iteration.
 */
export class InMemoryStore extends PipelineStoreBase {
  #entries = new Map<string, PipelineEntry>();

  add(entry: PipelineEntry): void {
    this.#entries.set(entry.id, entry);
  }

  remove(id: string): void {
    this.#entries.delete(id);
  }

  get(id: string): PipelineEntry | undefined {
    return this.#entries.get(id);
  }

  all(): PipelineEntry[] {
    return [...this.#entries.values()];
  }

  count(): number {
    return this.#entries.size;
  }

  close(): void {
    this.#entries.clear();
  }
}
