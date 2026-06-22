import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the build works both at the domain root
  // (shikharmishra.com) and at a project subpath (…github.io/PRO/).
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Content-hashed filenames: each build's JS has a unique URL, so a
        // browser/CDN can never serve a stale or broken cached copy. If a stale
        // index.html points at an old hash, the inline boot guard auto-reloads
        // with a cache-buster (see index.html) and self-heals.
        manualChunks: {
          // Isolate three.js so the DOM shell can paint while it streams in.
          three: ['three'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
