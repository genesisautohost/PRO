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
        manualChunks: {
          // Split the heavy WebGL stack into its own chunk so the DOM shell
          // can paint while three.js streams in behind the boot veil.
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
