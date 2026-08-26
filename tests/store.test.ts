import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStore,
  TableStore,
  type PipelineStore,
  type PipelineEntry,
} from '@sdk-e/pipeline';

function entry(id: string, source = 'test'): PipelineEntry {
  return {
    id,
    source,
    data: { value: Number(id) },
    tags: [source],
    meta: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function runStoreTests(name: string, createStore: () => PipelineStore) {
  describe(name, () => {
    let store: PipelineStore;

    beforeEach(() => {
      store = createStore();
    });

    it('starts empty', () => {
      expect(store.count()).toBe(0);
      expect(store.all()).toEqual([]);
    });

    it('adds and retrieves an entry', () => {
      const e = entry('1');
      store.add(e);
      expect(store.get('1')).toEqual(e);
      expect(store.count()).toBe(1);
    });

    it('upserts on duplicate id', () => {
      store.add(entry('1', 'first'));
      store.add(entry('1', 'second'));
      expect(store.count()).toBe(1);
      expect(store.get('1')?.source).toBe('second');
    });

    it('removes an entry', () => {
      store.add(entry('1'));
      store.add(entry('2'));
      store.remove('1');
      expect(store.get('1')).toBeUndefined();
      expect(store.count()).toBe(1);
    });

    it('returns undefined for nonexistent id', () => {
      expect(store.get('missing')).toBeUndefined();
    });

    it('returns all entries', () => {
      store.add(entry('1'));
      store.add(entry('2'));
      store.add(entry('3'));
      const all = store.all();
      expect(all).toHaveLength(3);
      expect(all.map((e) => e.id).sort()).toEqual(['1', '2', '3']);
    });

    it('counts entries', () => {
      expect(store.count()).toBe(0);
      store.add(entry('1'));
      expect(store.count()).toBe(1);
      store.add(entry('2'));
      expect(store.count()).toBe(2);
      store.remove('1');
      expect(store.count()).toBe(1);
    });

    it('filters entries', () => {
      store.add(entry('1', 'a'));
      store.add(entry('2', 'b'));
      store.add(entry('3', 'a'));
      const filtered = store.filter((e) => e.source === 'a');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((e) => e.source === 'a')).toBe(true);
    });

    it('sorts entries ascending by default', () => {
      store.add(entry('3'));
      store.add(entry('1'));
      store.add(entry('2'));
      const sorted = store.sortBy('id');
      expect(sorted.map((e) => e.id)).toEqual(['1', '2', '3']);
    });

    it('sorts entries descending', () => {
      store.add(entry('1'));
      store.add(entry('3'));
      store.add(entry('2'));
      const sorted = store.sortBy('id', 'desc');
      expect(sorted.map((e) => e.id)).toEqual(['3', '2', '1']);
    });

    it('sorts by numeric data values', () => {
      store.add({ ...entry('1'), data: { value: 10 } });
      store.add({ ...entry('2'), data: { value: 2 } });
      store.add({ ...entry('3'), data: { value: 100 } });
      const sorted = store.sortBy('id');
      expect(sorted.map((e) => e.id)).toEqual(['1', '2', '3']);
    });

    it('close clears the store', () => {
      store.add(entry('1'));
      store.close();
      expect(store.count()).toBe(0);
      expect(store.all()).toEqual([]);
    });
  });
}

runStoreTests('InMemoryStore', () => new InMemoryStore());
runStoreTests('TableStore', () => new TableStore());
