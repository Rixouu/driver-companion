import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts', // Will create this next
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/', // Exclude test files themselves from coverage
        '**/*.d.ts',
        '**/*.config.*', // Exclude config files
        '**/mockData.ts', // Exclude mock data
        // Add other files/patterns to exclude if needed
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}) 