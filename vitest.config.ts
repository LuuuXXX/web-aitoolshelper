import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      'server-only': `${root}tests/__mocks__/empty.ts`,
      'next/headers': `${root}tests/__mocks__/next-headers.ts`,
      '@': `${root}src`,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
