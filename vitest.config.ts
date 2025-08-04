import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__mocks__/**',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
    watchExclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});