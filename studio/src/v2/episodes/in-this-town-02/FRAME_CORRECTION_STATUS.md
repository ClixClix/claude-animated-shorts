# Episode 02 — Structural framing repair (2026-11-16)

**Feedback:** User rendered an early local version and reported massive camera/size problems and that the result looked horrible. This is **not acceptable as an approved release**. The first cut was authored without real rendered visual checks, so source-complete status should never be confused with a finished animation.

## Source-level failures identified

1. Old per-shot coordinates placed several cameras 1–3 world metres from 1.45m cat cards and 1.2–2.8m boxes, with a 38°–55° **vertical** FOV in 1080×1920 portrait. The resulting horizontal field of view was too narrow: obvious cropping and inexplicable scale variation.
2. Alley shot cameras near X≈−7, Z≈2–4 were literally inside/behind the fixed west storefront around X=−6.9, Z=.1 (width 2.9, depth 8). That could show obstructing masonry instead of the cats.
3. Box shots used the same upright 1.45m art for curled cats, leading to mismatched relative dimensions and boxes obscuring faces. The shared closing box had three tiny cat cards seated too low to be visible over the rim.
4. Episode 02 inherited unreleated clock/shelter/kitten props from the completed Episode 01 world. They obstruct framing and distract from the box story.
5. The render cache initially did not hash new camera-director source. Without an update, visual revisions could reuse incorrect old shot MP4s.

## Structural repairs committed

- `cameraDirector.ts`: shared 9:16 camera framing using the actual sizes and world positions of shot subjects. Treats indoor camera boundaries and the west alley storefront as **physical constraints**, maintains stable location-based view directions rather than orbiting randomly as cats move, and reserves subtitle/headroom.
- `Episode.tsx`: uses the shared framing director for every shot; removes the Episode 01-only sets/props while keeping the actual established café/city; corrects town sign text.
- `timeline.ts`: independent seated/inside-box posing, maintains box identity, places three smaller cats **high enough for their heads to clear the rim** in the closing scene.
- `scripts/episode02-render.mjs`: source hashing includes `cameraDirector.ts`, invalidating all stale segments after the revisions.
- `scripts/episode02-camera-audit.mjs`: deferred portrait crop / world-wall checks; integrated into `produce-box.mjs check`, which remains a **single later batch** rather than being triggered during builds.
- All changed and new files are included in `LOCAL_UPDATE_FILES.json`.

## Honest current state

These repairs are **source committed but not yet rendered or visually verified** on the user's Windows PC. No frame from the user's bad render was uploaded for inspection, so other visual shortcomings cannot be ruled out. **Do not tell the user the problem is fully solved or the episode looks good** until checking actual footage.

## Efficient local review instead of blindly re-rendering the whole film

After syncing the branch, to make a **small set of 540×960 portrait preview segments** using the existing prepared local scratch props:

```powershell
cd C:\V2\studio
node scripts/episode02-render.mjs preview --shots 03,07,09,20,32,39,50,51,54,59,60
```

Open `C:\V2\studio\out\v2-episodes\in-this-town-02\preview-segments\`. The above does **not** run batch QA, paid narration or a full new master. It requires the episode `render-props.json` to have been produced by an earlier prep/build. If absent, run `node scripts/episode02-prepare.mjs --allow-scratch` first.

A full new scratch master can instead be rendered using `node scripts/produce-box.mjs build --allow-scratch`. Only after the whole episode is assembled should `node scripts/produce-box.mjs check` run all independent source/encoded-file checks together, followed by actual human visual approval.

**Priority visual samples to request/inspect:** shop-interior shots 07/09, box scale shot 20, alley transformation 39, restoration 50/51, three-cat ending 59/60.
