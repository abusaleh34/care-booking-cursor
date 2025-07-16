import { defineConfig } from 'vitest/config';
import path from 'path';

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
    include: ['tests/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'care-services-ui'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  esbuild: {
    target: 'node14',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});