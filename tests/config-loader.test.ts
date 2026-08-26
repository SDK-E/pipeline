import { describe, it, expect } from 'vitest';
import { ConfigLoader } from '@sdk-e/pipeline';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const tmpDir = path.join(import.meta.dirname, '..', '.tmp-test-config');

describe('ConfigLoader', () => {
  it('loads existing config file', async () => {
    await mkdir(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'my-step.json');
    await writeFile(configPath, JSON.stringify({ key: 'value' }));

    const loader = new ConfigLoader(tmpDir);
    const config = await loader.load<{ key: string }>('my-step');

    expect(config).toEqual({ key: 'value' });

    await rm(tmpDir, { recursive: true });
  });

  it('returns empty object for missing config', async () => {
    await mkdir(tmpDir, { recursive: true });
    const loader = new ConfigLoader(tmpDir);
    const config = await loader.load('nonexistent');

    expect(config).toEqual({});

    await rm(tmpDir, { recursive: true });
  });

  it('uses default config dir when none provided', async () => {
    const loader = new ConfigLoader();
    const config = await loader.load('anything');
    expect(config).toEqual({});
  });
});
