# Episode 02 = Episode 01's actual animation assets

**Status 2026-11-17: SOURCE REWIRED, NOT COMPILED/RENDERED OR VISUALLY APPROVED**

The user rejected three attempts at an episode-two visual pilot and one independent stick-legged 2.5D articulated performer. They explicitly required reusing the **actual assets and items that made Episode 01 look good** rather than redrawing them in a similar style.

## What is now literally reused in the production Episode 02 composition

| Episode 01 source file | Exact production object now used by Episode 02 |
| --- | --- |
| `door-at-1111-polish/world.ts` | `new EpisodeWorld()` — café interior, café front, two established counter rows and fixtures, original outdoor town, real shelter and streetlights, and **original alley storage, dumpster and service props** |
| `door-at-1111-polish/actors.ts` | **`createEpisodeCat('mocha'/'essie'/'latte')`** — complete approved full-body drawings, expressions/whiskers/ears, dark-plum outlines and on-character episode color/shading |
| `door-at-1111-polish/walkingLegs.ts` | Original **`createWalkingLegs`** within those exact Episode 01 character assets; the failed simple cylinders/oval actor has been excluded |
| `cats/designs.ts`, `cats/drawCat.ts` | The exact *unmodified* Mocha silver tabby, Essie black/white, Latte cream/chocolate-point designs |
| `animation/kitten.ts` | Episode 01's actual `createKitten` drawn character used as the anonymous rule-demo cat — no recolored Essie stand-in |
| `door-at-1111-polish/population.ts` | Episode 01's original `TownPopulation` as **background-only** town onlookers, not replacement close-up leads |
| `videos/bridge/ink.ts`, `grade.ts`, `shade.ts`, `lensblur.ts` | The original ink, grade, character shading and lens blur pipeline. Episode 02 still requires lighting/composition review |

The new file `episode1Cast.ts` only adapts Episode 2's existing story coordinates/poses to the Episode 1 character rig's `Actor` interface. It does **not** draw a replacement cat or make a new material. The original Episode 1 source remains unchanged. The rejected `articulatedGuest.ts` and `ruleCats.ts` are left in the repo for audit/recovery, but **are no longer imported by the production Episode 02 composition**. These remain accessible only through rejected isolated proof compositions and should never be used as production quality examples.

## What's truly NEW because Episode 01 didn't include this story

The **three distinct magical boxes**, final large shared cardboard box, poster explaining the cure, chapter-specific storyline choreography, and cat-to-cardboard effects are Episode 02 inventions. They cannot truthfully be described as original Episode 01 assets. Their geometry, interactions, staging and metamorphosis still need scene-specific visual design and testing.

The **60-shot approved narrative order is preserved**: Mocha protects Essie, then she turns into a box, Mocha climbs into her box and restores Essie **first**, then Mocha and Essie rescue Latte at the café, then all three share a new box. Replacements may never reverse Essie/Latte cure order.

## Crucial limit: reusing assets ≠ finished Episode 2

The current 60-shot scratch timeline and automatically fitted cameras have previously failed visual tests. A correctly reused actor may still be hidden by a flap, intersect furniture, float, or shrink awkwardly in a box. The `episode1Cast.ts` adapter deliberately **does not stretch the real Episode 1 cat silhouette into cardboard**; when a morph reaches its terminal stage it hides the cat until a dedicated high-quality transformation is implemented. That effect is *not finished*.

No final MP4, audio, narrator payment or publishing is authorized. Do not use `produce-box.mjs build` yet.

## One-command low-cost proof

Sync the latest source to C:\V2. Run one of:
- Double-click `Build-Episode02-EP1-Assets.cmd`.
- `cd C:\V2\studio` then `node scripts/episode02-episode1-assets-preview.mjs`.

It typechecks the project, then renders **12 actual sampled 540×960 frames** from Episode 2 (Mocha's first scene, Latte and Essie's boxes, original town, first rescue, second rescue and ending) with authentic Episode 01 source objects. It does **not** generate a full 60-shot movie or call paid voice APIs. Results in `out/v2-episodes/in-this-town-02/ep1-asset-reuse-proof\` with `EP2_EP1_ASSET_PROOF.json`.

Review the first output frames. If a camera is obstructed or a cat looks too large/inside a prop, repair that *specific shot* rather than repeating full production or rebuilding the actor. **No visual approval claims before actual rendered footage is inspected.**

## Single-prompt long-term design

A natural-language episode prompt should produce a structured 60-shot narrative, feed the **immutable Episode 01 component and asset registry**, and direct new story-specific props/actions. Automatic local renders and actual frame inspection must validate physical contact, protagonist proportions, camera blockage, story order, captions and sound before assembly. This production engine does not exist yet; currently the exact-source asset adapter and proof render are the first deterministic foundation.
