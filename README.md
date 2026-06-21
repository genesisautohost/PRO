# 0xshikhar // RE — shikharmishra.com

Immersive, scroll-driven portfolio for **Shikhar Mishra** — reverse engineer &
bug bounty hunter. Built in the spirit of [igloo.inc](https://igloo.inc): one
continuous WebGL scene behind smooth-scrolled content, cinematic video panels,
and a live "passive exposure" recon demo.

## Stack

| Concern | Library |
| --- | --- |
| App / UI | React 18 + Vite |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| Post FX | @react-three/postprocessing (bloom · noise · vignette) |
| Smooth scroll | Lenis |
| Scroll animation | GSAP + ScrollTrigger |
| Shared state | Zustand |

The DOM layer and the WebGL layer share a single scroll/pointer mirror
(`src/store/useAppStore.js` → `scrollState`). Lenis writes it once per frame;
the 3D camera reads it inside `useFrame`, so the scene never re-renders React
and stays smooth.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the production build
```

## Where to edit content

Grep for these markers (kept from the original single-file version):

| Marker | File |
| --- | --- |
| `EDIT:HERO` / `EDIT:STATS` | `src/components/Hero.jsx` |
| `EDIT:ABOUT` | `src/components/About.jsx` |
| `EDIT:FINDINGS` | `src/components/Findings.jsx` |
| `EDIT:ARSENAL` | `src/components/Arsenal.jsx` |
| `EDIT:CONTACT` | `src/components/Contact.jsx` |
| `EDIT:VIDEOS` | `src/App.jsx` + `src/components/VideoSection.jsx` |
| Colors | `:root` in `src/styles/global.css` (`--signal` swaps the accent) |

## Videos

The cinematic panels currently render a **procedural amber-grid fallback** —
no video files are required to ship. To use real footage:

1. Drop clips into `public/media/` (e.g. `disassemble.mp4`).
2. Uncomment / set the matching `src="/media/<file>.mp4"` on each
   `<VideoSection>` in `src/App.jsx`.

Recommended: H.264 MP4, muted, short seamless loop, ≤ ~6 MB each.

## Deploy

Static build — works on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
Build command `npm run build`, output directory `dist`.

## Notes

- The recon panel is 100% client-side. The only outbound request is the
  visitor's own public-IP lookup (`ipapi.co`, falling back to `ipwho.is`).
  Swap for your own backend if you don't want visitor IPs touching a third party.
- Respects `prefers-reduced-motion`: smooth scroll, parallax, and heavy
  animation are disabled for users who ask for it.
