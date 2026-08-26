import type { PipelineEntry } from '@sdk-e/pipeline';

/**
 * The contract every pipeline store must implement.
 * Swap this for any backend — in-memory, SQLite, Postgres, file, etc.
 */
export interface PipelineStore {
  add(entry: PipelineEntry): void;
  remove(id: string): void;
  get(id: string): PipelineEntry | undefined;
  all(): PipelineEntry[];
  count(): number;
  close(): void;
}

/**
 * Base class that provides default filter and sortBy implementations.
 * Extend this instead of implementing PipelineStore directly to get
 * filter/sortBy for free — they operate on the array returned by all().
 */
export abstract class PipelineStoreBase implements PipelineStore {
  abstract add(entry: PipelineEntry): void;
  abstract remove(id: string): void;
  abstract get(id: string): PipelineEntry | undefined;
  abstract all(): PipelineEntry[];
  abstract count(): number;
  abstract close(): void;

  filter(predicate: (entry: PipelineEntry) => boolean): PipelineEntry[] {
    return this.all().filter(predicate);
  }

  sortBy(key: keyof PipelineEntry, direction: 'asc' | 'desc' = 'asc'): PipelineEntry[] {
    const entries = [...this.all()];
    return entries.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return direction === 'asc' ? cmp : -cmp;
    });
  }
}
