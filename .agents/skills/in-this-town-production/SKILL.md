---
name: in-this-town-production
description: Safely edit and produce What If Cats / In This Town scenes in the existing Three.js + Remotion repository, using the director lock, Episode 01 style, three-frame PNG visual gate, and native audio/release QA. Use for Episode 02 repairs or future episodes.
---

# In This Town — Codex production skill

## Read before changing anything

1. Repository root `AGENTS.md` (highest-priority local operating requirements).
2. `PRODUCTION_DIRECTOR_LOCK.json` in the target episode folder. For Episode 02 the exact path is `studio/src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json`.
3. `studio/src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json`, `studio/src/v2/series/episode1Style.ts`, `QUALITY_BASELINE.md` and `ONE_PROMPT_IN_THIS_TOWN.md`.
4. The live narration manifest `studio/out/v2-episodes/in-this-town-02/render-props.json`; respect its actual shot start/end frames and approved Adam word timings. Historical scratch 3,876-frame plans are NOT the live source.
5. `studio/src/v2/episodes/in-this-town-02/V9_REJECTED_VISUAL_QA.json`: the creator rejected V9, with specific unresolved character, geometry, camera, rescue, audio and framing defects. Do not mark those defects fixed without inspecting new footage.
6. Existing local `CLAUDE.md` files if present on the working machine. They are supplementary; don't invent or silently override undocumented conventions. No `CLAUDE.md` or `.claude/` was present in the connected GitHub `v2-local-render` branch when this skill was created.

## Scope lock — mandatory

- Do **not** edit the core renderer/engine, shared camera rigs, global composition wrappers, Episode 01 files, shared series locks, root dependencies, hooks, or other episodes unless the user explicitly asks.
- Write source changes **only inside the target scene folder**, e.g. `studio/src/v2/episodes/in-this-town-02/`. Write renders, QA reports and assets only inside that episode's output folder under `studio/out/v2-episodes/`.
- A scene-local camera director may be corrected to follow locked shot directions, but **never** alter global camera conventions or shared camera infrastructure under this task.
- Never change a locked story beat to make an animation easier. In particular, Shot 51 must follow the original director lock, not the earlier unauthorized hinged-door rewrite.
- Do not rewrite or disable checks to force an exit code 0. Log the mismatch and fix the actual failure inside permitted scope.

## Sequential execution — no Claude hook or sub-agent assumptions

**Before syncing this GitHub branch to the user's Windows clone:** V9 scene source on the local PC may be newer than the remote branch. First inspect `git status` and compare relevant scene-file hashes. Never overwrite local episode code, assets, approved audio, render props or the local V9 work with older remote files. The only intended Phase 1/2 additions are the Codex instruction/skill files and scene-local QA tools/register.

Execute these as plain terminal steps in the same working tree, stopping immediately on nonzero exit. Do not assume a Claude hook, parallel agent, or a background run has completed any prerequisite.

From the repository's `studio/` directory on Windows:

0. Run `node --test src/v2/episodes/in-this-town-02/tools/locked-edit-gate.test.mjs` to verify the manifest guard, then inspect any failures rather than bypassing them.
1. `npm.cmd run episode2:director-audit` — inspect any unresolved physical action/prop/location blockers.
2. `npm.cmd run episode2:code-audit` and `npm.cmd run episode2:action-audit-strict` — source/physical-action checks; these are NOT image approval.
3. `node src/v2/episodes/in-this-town-02/tools/locked-edit-gate.mjs` — **must pass before stills**. Reject story/action/camera substitutions, missing beats, changed narration, stale scratch timelines, wrong sub-shot IDs, disjoint frames or missing Adam provenance. It writes `EP02_LOCKED_EDIT_GATE.json` under the existing episode output folder. Its pass only proves metadata consistency, never physical acting.
4. `npm.cmd run episode2:style-check` — check locked Episode 01 source. If the real approved Episode 01 MP4 is available, additionally verify it via `node scripts/episode02-style-preflight.mjs --reference "C:\\path\\to\\approved-episode01.mp4"`. `NOT_SUPPLIED` is not a verified film comparison.
5. **Render three actual low-resolution PNGs per changed shot, or per every shot before an all-segment render:**

   `node src/v2/episodes/in-this-town-02/tools/three-frame-gate.mjs --shots 06,07B,51`

   For the entire live narration-aligned shot manifest:

   `node src/v2/episodes/in-this-town-02/tools/three-frame-gate.mjs`

   Outputs are `studio/out/v2-episodes/in-this-town-02/three-frame-review/`, with start/middle/end PNGs and `THREE_FRAME_REVIEW.json`.
6. **Directly open and inspect the PNGs**, not just filenames and tests. Verify true 2D-in-3D depth layering, billboard/card occlusion, correct characters and box identities, camera framing and visibility, ground contacts, prop scaling, and zero box/character clipping. If anything fails, correct only the scene-local source, rerun all prior gates and the still renders, and inspect again. Do not call the PNGs approved from a zero exit status.
7. PNGs alone cannot catch all motion faults. Render affected **moving** previews and inspect the beginning, contacts, transformations, and ending at normal speed. Example: `node scripts/episode02-render.mjs preview --shots 06,07B,51 --force`. Follow the existing visual-approval queue and preserve original locked story actions.
8. Once every changed shot and every live manifest shot is visually approved, proceed through the existing Episode 02 assembler and finishing workflow; check narration, SFX hits, licensed music, caption timing, and rights. Avoid regenerating paid narration.
9. Run native 1080×1920, 30fps output only after actual moving-image approval, then run `npm.cmd run episode2:check` and the exact-file `studio/scripts/release_quality_gate.py` with the real approved frame count and `--series in_this_town`; require creative/rights signoff before publication.

## Nonnegotiable reporting

For every attempted repair: report changed file paths, target shot IDs, exact command results, PNG/clip inspection evidence, unresolved issues and next permitted action. State `VISUAL_REVIEW_PENDING` if images or the finished MP4 were not actually reviewed. Do not substitute successful typechecks, successful MP4 assembly, or a high numeric confidence estimate for visual approval.

## Source references and portability

The connected GitHub branch already contains `AGENTS.md`, `SKILL.md`, `QUALITY_BASELINE.md`, `ONE_PROMPT_IN_THIS_TOWN.md` and exact `studio/package.json` commands. No Claude-specific skills/commands/hooks were present to migrate **in that remote branch**. If newer `CLAUDE.md` or `.claude/` files exist on the user's unsynced Windows machine, read and reconcile them explicitly before claiming full migration.
