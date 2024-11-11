import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

const __dirname = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const manualChunks = (id: string) => {
  if (id.includes('node_modules')) {
    return 'vendor'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@src': __dirname('./src'),
      '@site': __dirname('./site'),
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
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
