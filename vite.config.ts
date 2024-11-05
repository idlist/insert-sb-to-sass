import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import cleanup from 'rollup-plugin-cleanup'

const __dirname = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    cleanup({
      extensions: ['js', 'ts'],
    }),
  ],
  resolve: {
    alias: {
      '@src': __dirname('./src'),
      '@site': __dirname('./site'),
    },
  },
  test: {
    dir: __dirname('./test'),
    typecheck: {
      enabled: true,
    },
  },
  build: {
    lib: {
      entry: {
        'index': __dirname('./src/index.ts'),
      },
      name: 'InsertSbToSass',
    },
    outDir: 'lib',
    sourcemap: true,
    minify: false,
  },
})
