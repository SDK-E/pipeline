# Contributing

## Development Setup

```bash
git clone https://github.com/sdk-e/pipeline.git
cd pipeline
nvm use
npm install
```

## Commands

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Typecheck without emitting |

## PR Process

1. Create a branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm test` — both must pass
4. Open a PR with a clear description of what changed and why

## Commit Convention

Keep it simple. Use imperative mood ("add feature", not "added feature"). No strict format required.

## Code Style

- Strict TypeScript, no `any`
- Private fields use `#` prefix (ECMAScript private)
- ESM only (`.js` extensions in imports)
- No comments unless the logic is non-obvious
