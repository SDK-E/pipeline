# Changelog

## 0.1.0

Initial release.

- `PipelineEngine` — sequential step execution with pluggable parser
- `PipelineStore` interface + `PipelineStoreBase` abstract class
- `InMemoryStore` — Map-backed, zero dependencies
- `TableStore` — ordered, upsert semantics
- `PipelineItemInterface` / `PipelineParserInterface` — step and parser contracts
- `ConfigLoader` — per-step JSON config from disk
- Full test suite (37 tests)
