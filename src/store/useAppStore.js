import { create } from 'zustand'

/**
 * Single source of truth shared between the DOM (React) layer and the
 * WebGL (R3F) layer. Scroll + pointer are written here on every frame by the
 * Lenis/GSAP driver and read inside useFrame — no React re-renders involved,
 * so the 3D scene stays at 60fps regardless of the DOM.
 */
export const useAppStore = create((set) => ({
  // 0..1 progress through the whole document
  scroll: 0,
  // index of the section currently in view (drives the 3D "scene morph")
  section: 0,
  // normalized pointer (-1..1)
  pointer: { x: 0, y: 0 },
  // boot/loader gate
  booted: false,

  setScroll: (scroll) => set({ scroll }),
  setSection: (section) => set({ section }),
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setBooted: (booted) => set({ booted }),
}))

// Plain mutable mirror for hot-path reads inside useFrame (avoids selector cost).
export const scrollState = { scroll: 0, px: 0, py: 0, section: 0 }
