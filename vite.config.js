import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
  // Relative paths so it works at the domain root or a project subpath.
  base: './',
  // Bundle EVERYTHING (JS + CSS) inline into a single index.html. This removes
  // the separate chunk files that GitHub's CDN was serving inconsistently and
  // causing blank pages. One file: if it loads, the whole app runs.
  plugins: [react(), viteSingleFile()],
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 4000,
  },
})
