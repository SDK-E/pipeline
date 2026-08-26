import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Loads config for a step from ./config/steps/<stepName>.json.
 * Each step's config lives in its own file — no shared config blob,
 * so steps stay decoupled and configs can be edited/versioned independently.
 */
export class ConfigLoader {
  #configDir: string;

  constructor(configDir = './config/steps') {
    this.#configDir = configDir;
  }

  async load<T = Record<string, unknown>>(stepName: string): Promise<T> {
    const filePath = path.join(this.#configDir, `${stepName}.json`);
    try {
      const raw = await readFile(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return {} as T;
    }
  }
}
