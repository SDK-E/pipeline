import type { PipelineEntry } from '@sdk-e/pipeline';
import { PipelineStoreBase } from '@sdk-e/pipeline';

/**
 * Ordered store backed by a Map. Preserves insertion order,
 * performs upsert on add (same id replaces previous entry).
 * Intentionally identical to InMemoryStore in v0.1.0 — the
 * semantic distinction matters: TableStore signals production
 * data with ordered iteration, InMemoryStore signals fast and
 * disposable. Future versions may add persistence to TableStore.
 */
export class TableStore extends PipelineStoreBase {
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
