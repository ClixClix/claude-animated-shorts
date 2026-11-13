# What If Cats V2: character study 01

Original Canvas 2D character art, derived from inspection of 12 privately held reference frames.
No photograph, video, private brief, or external image is imported or loaded by these components.
The BridgeShort implementation is unchanged. No old What If Cats engine is used.

## Review the actual renders

From `studio/`:

```sh
npm run typecheck
node scripts/v2-cat-rig-check.mjs
node scripts/v2-character-sheets.mjs
```

Requires installed dependencies and Chromium (defaults to `/usr/bin/chromium`, overridable with `CHROME`).
The render script bundles once and exports five frame-zero Remotion PNGs plus a manifest to
`out/v2-character-design/`. The compositions are one-frame design sheets, not animation previews.
The first three show front, right side, and right three-quarter at the same ground line and scale.
The fourth compares six expressions for each cat; the fifth is the 3-by-3 cast turnaround.
All sheets use the same warm-paper stage and upper-left illustrated light.

## Reuse

- `designs.ts`: shared, per-character palettes and proportion parameters.
- `pose.ts`: view presets, bounded pose controls, deterministic idle/walk evaluation.
- `drawCat.ts`: transparent 500 x 550 drawing, grounded at design y=480. Reuses Bridge's
  plum ink, color mix and Pen idiom without importing its cast/world or altering its example.
- `Cat.tsx`: reusable React canvas with a Remotion render gate, and `createCatCard` for
  a lit, transparent Three.js plane using exactly the same drawing. Dispose the card on teardown.
- `Sheets.tsx`: presentation only; identity and drawing live outside the sheet.

```tsx
<Cat id="mocha" pose={{yaw: 0.58, expression: 'concerned', gazeX: -0.5, headTilt: -0.1}} />
// Motion is opt-in, deterministic and evaluated at an explicit time:
<Cat id="essie" seconds={frame / fps} motion="idle" />
```

`pose` overrides evaluated motion. `yaw`: -1 left profile, 0 front, +1 right profile;
`headTurn` adds independent normalized head yaw. `gazeX/Y`, `earLeft/Right`, `tail` and
`breath` are normalized controls. `blink` is 0 open to 1 shut. `headTilt` uses radians.
`walking` enables the four-leg stance and `gait` is a phase in radians. The card exposes
`mesh`, `update(pose)`, and `dispose()`. The scene owns its position, billboard orientation,
lighting and ink-layer policy. The card adapter has not yet been staged in a new world.

## Art direction and approval limits

- Mocha: cool silver gray, darker tabby crown/cheeks/back/tail, white blaze, bib and socks;
  the warm cast of some source frames is not treated as orange fur.
- Essie: charcoal black plush body, broad cheeks, a small irregular white chin, compact
  chest flash and pale toe tips; conspicuous cream-white whiskers, no broad facial mask.
- Latte: cream coat, chocolate mask/ears/tail/paws, pale muzzle and cool pale eyes.
- Shared language: outlined silhouettes, restrained painted shade, almond eyes and fur tufts.
  Expressions preserve markings and base proportions.

The references do not fully establish standing side anatomy, opposite-side markings, Latte's
exact tail pattern or all paw markings. These are conservative design interpretations, not
verified likenesses. Profile head construction switches at near-side yaw to hide the far eye;
this is a drawing rig for approval, not a finished smoothly interpolated turnaround animation.
Idle and walking controls are present and checked as still poses; locomotion polish and staging
await character approval. Do not build a café or episode before that review.

The Chromium rig check exercises the actual Canvas drawing, checking visible responses,
expression distinctness, unclipped transparent bounds and deterministic redraws. It uses
`willReadFrequently` to keep Canvas rasterization on the CPU during pixel comparisons.
There are 66 sampled identity/pose checks. These checks do not establish user approval.
