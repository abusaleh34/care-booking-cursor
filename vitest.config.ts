import { defineConfig } from 'vitest/config';
import path from 'path';
import 'reflect-metadata';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: { 
      reporter: ['text', 'html'],
      provider: 'v8',
      reportsDirectory: './coverage'
    },
    maxConcurrency: 5,
    bail: 20, // fail-fast after 20 failures
    setupFiles: ['./src/test-setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/integration/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'care-services-ui', 'tests/e2e/**'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 30000, // 30 seconds for individual tests
    hookTimeout: 30000, // 30 seconds for hooks
  },
  esbuild: {
    target: 'node16',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});