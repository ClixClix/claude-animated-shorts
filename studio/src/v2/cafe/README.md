# Permanent café, phase 2

One shop, one fixed environment. Metres; Y up; street/entrance +Z, preparation wall -Z.

`config.ts` owns all fixture IDs, world-space anchors, sizes, support surfaces, cat placements,
window apertures and camera definitions. `environment.ts` is the only geometry factory for
architecture, furniture, nested permanent props, town and lights. It has no shot-dependent
branches. Permanent details are children of their fixture/architecture group. Adding furniture
requires adding a unique configured role/ID rather than spawning it in an episode.

`Cafe.tsx` instantiates that same environment in every shot, reuses the original engine's InkPass,
LensBlur (close-up only), BloomEffect, neutral tone mapping and GradeEffect, and presents the
approved cat drawings as lit alpha-tested Three.js cards. No approved drawing code is changed.
No geometry or cat world position changes when selecting a shot. Camera choice and a subtle
Essie facial performance are the only shot-specific state.

Run from studio:

```sh
npm run typecheck
node src/v2/cafe/layout.test.mjs
node scripts/v2-cat-rig-check.mjs
node scripts/v2-cafe-render.mjs
/workspace/.venvs/animated-shorts/bin/python src/v2/cafe/build_storyboard.py
```

The render script accepts `--draft` for half-resolution inspection and an optional shot name
(`Exterior`, `Wide`, `Counter`, `Closeup`). It uses installed Chromium, overridable via `CHROME`,
and `swangle` for reliable headless 3D. Final renders remain 1080 × 1920. No external assets or
credentials are needed. The Python storyboard step uses Pillow in the already installed venv.

`layout.test.mjs` runs production structural checks and two deliberately invalid regression
probes. Rendering additionally audits actual material/geometry/texture readiness, required
frustum positions and raycast occlusions, cameras outside geometry, permanent scene transforms,
scene graph signatures and source hashes. `build_storyboard.py` refuses stale or inconsistent
final renders. Raycasts check story-object/face centers and supplement visual inspection; they
do not substitute for viewing the actual PNGs.

Future animation must retain these anchors and validate new camera paths. The supplied
compositions are intentionally still-only for storyboard approval. No café episode or audio
has been started. Drafts and final frames are generated into the ignored `out/v2-cafe/` folder.
