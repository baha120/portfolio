# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start Vite dev server (localhost:5173)
yarn build        # Type-check (tsc -b) + production build
yarn preview      # Preview production build
yarn lint         # Run ESLint (v9, flat config)
```

Package manager is **Yarn** (nodeLinker: node-modules via `.yarnrc.yml`). No test framework is configured.

## Architecture

Interactive 3D portfolio website built with **Vite + React 19 + React Three Fiber + Tailwind CSS v4**. The experience is a camera-on-rails journey along a CatmullRom curve, with the user navigating through experience sections via forward/backward buttons.

### Core Concepts

**Path-based navigation**: A single `CatmullRomCurve3` with 5 control points defines the entire journey (defined in `experience-scene.tsx`). Progress is a normalized 0–1 value that drives camera position, active section, and environment blending. Frenet frames (tangent/normal/binormal) computed from the curve orient both the camera and objects along the path.

**Particle tube**: The tube geometry is rendered as `<points>` (not a solid mesh) with custom GLSL shaders, creating a glowing particle trail along the path. ~8,800 vertices from `tubeGeometry(curve, 520, 0.08, 16)`. Particles scatter outward via a GSAP-animated `uProgress` uniform on load.

**Section-driven theming**: Each `ExperienceSection` in `src/data/experience.ts` defines a `tStart`/`tEnd` range (0–1) and its own environment config (`background`, `fogColor`, `lightIntensity`, `accent`). Colors and lighting lerp smoothly as the user transitions between sections.

**Overlay panels**: Checkpoint panels (projects, accounts) are defined in `App.tsx` and shown as HTML overlays when the user is within `±0.08` of a section midpoint. These are keyed by section `id`.

**Physics**: `@react-three/rapier` provides rigid body physics for 3D model interactions (e.g. book drop).

### Key Files

- `src/App.tsx` — Root: Canvas, scroll/progress state, overlay UI panels, forward/backward navigation buttons
- `src/experience-scene.tsx` — Main R3F scene: curve definition, tube particles, wobble spheres, environment blending, camera, physics bodies, GLTF model loading
- `src/data/experience.ts` — `ExperienceSection` type and section array with time ranges and environment configs
- `src/modules/components/PathCamera.tsx` — Camera that follows the curve: positioned behind+above the path point, looks ahead along the tangent
- `src/modules/components/WobbleSphere.tsx` — Icosahedron with custom simplex noise deformation, placed at section midpoints, oriented via Frenet frames
- `src/modules/loading/OverlayScreen.tsx` — Full-screen black overlay that fades out via GSAP when assets load (or after 4s fallback)
- `src/modules/utils/frenetFrames.ts` — `FrenetFrames` type and `getFrameAt()` helper for sampling curve orientation

### Shader Pipeline

GLSL files are imported as strings via `vite-plugin-glsl` (configured in `vite.config.ts`). Type declarations in `types/shaders.d.ts`.

Two shader sets:
- `src/modules/shaders/particles/` — Point cloud rendering (size + radial glow alpha)
- `src/modules/shaders/wobble/` — Simplex 4D noise deformation via `three-custom-shader-material` extending `MeshStandardMaterial`
- `src/modules/shaders/includes/simplexNoise4d.glsl` — Shared noise function, concatenated at runtime with template literals (see `WobbleSphere.tsx` line 12)

### Animation Patterns

All continuous animations use `useFrame` with lerp smoothing (factors 0.05–0.1). GSAP is used for one-shot transitions (loading overlay fade, particle scatter). The `leva` package is available for debug UI controls.

### 3D Models

GLTF models are stored in `public/models/` and loaded via `useGLTF` from `@react-three/drei`. Each model directory contains `scene.gltf`, `scene.bin`, textures, and a `license.txt`.

### Path Alias

`@/*` maps to `./src/*` (configured in both `vite.config.ts` and `tsconfig.json`).
