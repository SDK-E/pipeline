import type { PipelineStore } from '@sdk-e/pipeline';
import type { PipelineLogger } from '@sdk-e/pipeline';

/**
 * Runs once at the end of the pipeline and decides what to do with the
 * final store — write CSV, dedupe + score, push to a CRM, whatever.
 * Swappable strategy so you can try different end-of-pipeline behavior
 * without touching the steps themselves.
 */
export interface PipelineParserInterface {
  readonly name: string;
  configure(logger: PipelineLogger): void;
  parse(store: PipelineStore): Promise<void>;
}
