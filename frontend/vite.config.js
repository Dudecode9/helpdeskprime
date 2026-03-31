import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    // Ключевой параметр: отключаем Rollup
    rollupOptions: {
      output: {
        format: "es"
      }
    },
    // Включаем ESBuild для финальной сборки
    minify: "esbuild"
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext"
    }
  }
})
