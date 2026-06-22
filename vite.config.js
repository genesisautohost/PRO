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
        // Stable (un-hashed) filenames: a cached index.html can never point to
        // a deleted hashed chunk → no more 404 blank screens after a deploy.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: {
          // Isolate three.js so the DOM shell can paint while it streams in.
          three: ['three'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
