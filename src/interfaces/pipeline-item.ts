import type { PipelineStore } from '@sdk-e/pipeline';
import type { PipelineLogger } from '@sdk-e/pipeline';

/**
 * Every pipeline step implements this. Config is generic per-step so each
 * item's settings stay isolated — no shared/global config object.
 */
export interface PipelineItemInterface<TConfig = Record<string, unknown>> {
  readonly name: string;
  configure(config: TConfig, logger: PipelineLogger): void;
  execute(store: PipelineStore): Promise<void>;
}
