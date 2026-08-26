export interface PipelineEntry {
  id: string;
  source: string;
  data: Record<string, unknown>;
  tags: string[];
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
