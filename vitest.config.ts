import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@sdk-e/pipeline': path.resolve('./src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
