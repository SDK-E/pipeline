import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PipelineEngine,
  InMemoryStore,
  SilentLogger,
  DefaultLogger,
  type PipelineItemInterface,
  type PipelineParserInterface,
  type PipelineStore,
  type PipelineEntry,
} from '@sdk-e/pipeline';

function makeEntry(id: string): PipelineEntry {
  return {
    id,
    source: 'test',
    data: {},
    tags: [],
    meta: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function makeStep(name: string, fn?: (store: PipelineStore) => void): PipelineItemInterface {
  return {
    name,
    configure: vi.fn(),
    execute: vi.fn(async (store: PipelineStore) => {
      fn?.(store);
    }),
  };
}

function makeParser(name: string, fn?: (store: PipelineStore) => void): PipelineParserInterface {
  return {
    name,
    configure: vi.fn(),
    parse: vi.fn(async (store: PipelineStore) => {
      fn?.(store);
    }),
  };
}

describe('PipelineEngine', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('runs steps in order', async () => {
    const order: string[] = [];
    const step1 = makeStep('step-1', () => order.push('step-1'));
    const step2 = makeStep('step-2', () => order.push('step-2'));
    const step3 = makeStep('step-3', () => order.push('step-3'));

    const engine = new PipelineEngine(store);
    engine.register(step1).register(step2).register(step3);
    await engine.run();

    expect(order).toEqual(['step-1', 'step-2', 'step-3']);
  });

  it('configures each step with config and logger', async () => {
    const step = makeStep('step-1');
    const config = { key: 'value' };

    const engine = new PipelineEngine(store);
    engine.register(step, config);

    const [passedConfig, passedLogger] = step.configure.mock.calls[0];
    expect(passedConfig).toEqual(config);
    expect(passedLogger).toBeDefined();
    expect(typeof passedLogger.info).toBe('function');
    expect(typeof passedLogger.error).toBe('function');
  });

  it('passes the store to each step', async () => {
    let receivedStore: PipelineStore | undefined;
    const step = makeStep('step-1', (s) => {
      receivedStore = s;
      s.add(makeEntry('1'));
    });

    const engine = new PipelineEngine(store);
    engine.register(step);
    await engine.run();

    expect(receivedStore).toBe(store);
    expect(store.count()).toBe(1);
  });

  it('runs parser after all steps', async () => {
    const order: string[] = [];
    const step = makeStep('step-1', () => order.push('step-1'));
    const parser = makeParser('parser-1', () => order.push('parser-1'));

    const engine = new PipelineEngine(store);
    engine.register(step).useParser(parser);
    await engine.run();

    expect(order).toEqual(['step-1', 'parser-1']);
  });

  it('configures parser with logger', async () => {
    const parser = makeParser('parser-1');

    const engine = new PipelineEngine(store);
    engine.useParser(parser);

    expect(parser.configure).toHaveBeenCalledOnce();
    const [passedLogger] = parser.configure.mock.calls[0];
    expect(passedLogger).toBeDefined();
    expect(typeof passedLogger.info).toBe('function');
  });

  it('runs without parser', async () => {
    const step = makeStep('step-1');
    const engine = new PipelineEngine(store);
    engine.register(step);
    await engine.run();
    expect(step.execute).toHaveBeenCalledOnce();
  });

  it('supports chaining register calls', () => {
    const engine = new PipelineEngine(store);
    const result = engine.register(makeStep('a')).register(makeStep('b'));
    expect(result).toBe(engine);
  });

  it('supports chaining useParser', () => {
    const engine = new PipelineEngine(store);
    const result = engine.useParser(makeParser('p'));
    expect(result).toBe(engine);
  });

  it('propagates step errors', async () => {
    const failingStep: PipelineItemInterface = {
      name: 'failing',
      configure: vi.fn(),
      execute: vi.fn(async () => {
        throw new Error('step failed');
      }),
    };

    const engine = new PipelineEngine(store);
    engine.register(failingStep);

    await expect(engine.run()).rejects.toThrow('step failed');
  });

  it('propagates parser errors', async () => {
    const failingParser: PipelineParserInterface = {
      name: 'failing-parser',
      configure: vi.fn(),
      parse: vi.fn(async () => {
        throw new Error('parser failed');
      }),
    };

    const engine = new PipelineEngine(store);
    engine.useParser(failingParser);

    await expect(engine.run()).rejects.toThrow('parser failed');
  });

  it('step can add entries that next step sees', async () => {
    const step1 = makeStep('step-1', (s) => {
      s.add(makeEntry('1'));
      s.add(makeEntry('2'));
    });
    let countInStep2 = 0;
    const step2 = makeStep('step-2', (s) => {
      countInStep2 = s.count();
    });

    const engine = new PipelineEngine(store);
    engine.register(step1).register(step2);
    await engine.run();

    expect(countInStep2).toBe(2);
  });

  it('accepts a custom logger', async () => {
    const logs: string[] = [];
    const customLogger = {
      info: (msg: string) => logs.push(`INFO: ${msg}`),
      warn: (msg: string) => logs.push(`WARN: ${msg}`),
      error: (msg: string) => logs.push(`ERROR: ${msg}`),
      debug: (msg: string) => logs.push(`DEBUG: ${msg}`),
    };

    const engine = new PipelineEngine(store, { logger: customLogger });
    engine.register(makeStep('step-1'));
    await engine.run();

    expect(logs.some((l) => l.includes('starting with 1 step(s)'))).toBe(true);
    expect(logs.some((l) => l.includes('running step: step-1'))).toBe(true);
    expect(logs.some((l) => l.includes('complete'))).toBe(true);
  });

  it('uses DefaultLogger when no logger provided', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const engine = new PipelineEngine(store);
    engine.register(makeStep('step-1'));
    await engine.run();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses SilentLogger to suppress output', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const engine = new PipelineEngine(store, { logger: new SilentLogger() });
    engine.register(makeStep('step-1'));
    await engine.run();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('generates a uuid4 id by default', () => {
    const engine = new PipelineEngine(store);
    expect(engine.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('accepts a custom id', () => {
    const engine = new PipelineEngine(store, { id: 'my-pipeline-123' });
    expect(engine.id).toBe('my-pipeline-123');
  });

  it('defaults name to "pipeline"', () => {
    const engine = new PipelineEngine(store);
    expect(engine.name).toBe('pipeline');
  });

  it('accepts a custom name', () => {
    const engine = new PipelineEngine(store, { name: 'etl-job' });
    expect(engine.name).toBe('etl-job');
  });

  it('includes name and id prefix in log messages', async () => {
    const logs: string[] = [];
    const customLogger = {
      info: (msg: string) => logs.push(msg),
      warn: () => {},
      error: () => {},
      debug: () => {},
    };

    const engine = new PipelineEngine(store, {
      id: 'aaaa-bbbb-cccc-dddd-eeee-ffff-1111-2222',
      name: 'etl',
      logger: customLogger,
    });
    engine.register(makeStep('step-1'));
    await engine.run();

    expect(logs[0]).toContain('[etl(aaaa-bbb)]');
    expect(logs[1]).toContain('[etl(aaaa-bbb)] running step: step-1');
  });

  it('each engine gets a unique id', () => {
    const a = new PipelineEngine(store);
    const b = new PipelineEngine(store);
    expect(a.id).not.toBe(b.id);
  });
});

describe('DefaultLogger format options', () => {
  it('uses [pipeline] prefix by default', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new DefaultLogger();
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('[pipeline] test message');
    spy.mockRestore();
  });

  it('accepts a custom prefix', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new DefaultLogger({ prefix: '[my-app]' });
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('[my-app] test message');
    spy.mockRestore();
  });

  it('accepts a full format function', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new DefaultLogger({
      format: (entry) => `${entry.level.toUpperCase()} | ${entry.message}`,
    });
    logger.info('hello');
    expect(spy).toHaveBeenCalledWith('INFO | hello');
    spy.mockRestore();
  });

  it('format receives timestamp', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new DefaultLogger({
      format: (entry) => `${entry.timestamp.toISOString()} ${entry.message}`,
    });
    logger.info('timed');
    const output = spy.mock.calls[0][0] as string;
    expect(output).toMatch(/^\d{4}-\d{2}-\d{2}T.* timed$/);
    spy.mockRestore();
  });

  it('warn and error use console.warn and console.error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new DefaultLogger();
    logger.warn('w');
    logger.error('e');
    expect(warnSpy).toHaveBeenCalledWith('[pipeline] w');
    expect(errorSpy).toHaveBeenCalledWith('[pipeline] e');
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
