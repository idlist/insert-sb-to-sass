import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

const __dirname = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': __dirname('./site'),
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer,
      ],
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  // build: {
  //   lib: {
  //     entry: {
  //       'index': __dirname('./src/index.ts'),
  //     },
  //     name: 'InsertSbToSass',
  //   },
  //   outDir: 'lib',
  //   sourcemap: true,
  //   minify: false,
  // },
})
