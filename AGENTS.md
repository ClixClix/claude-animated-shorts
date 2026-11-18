# In This Town / What If Cats — repository production instructions

**Use this file automatically whenever a coding/production agent is asked to make or fix an In This Town episode. The goal is ONE creative prompt, not a user-written 60-shot technical specification.**

## Precedence and the source of truth

1. The **latest explicit user direction** beats older plans or speculative agent choices.
2. For active Episode 02, `studio/src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json` contains the **60 user-directed visible actions, camera intentions, scene locations, and prop continuity requirements**. This is the single creative source of truth. It does NOT mean these actions have been animated yet.
3. The reusable series appearance and character source is `studio/src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json`, `studio/src/v2/series/episode1Style.ts`, and the actual Episode 01 sources under `studio/src/v2/episodes/door-at-1111-polish/`. Reuse those rigs and world directly.
4. Episode 02's `DRAFT_BOX_NARRATION.txt`, approved ElevenLabs Adam WAV, and actual `Approved_Word_Timings.json` are the timing and speech authority. **Do not regenerate voice** to fix visual problems.
5. `EDITORIAL_SCRATCH_PLAN.json`, `DRAFT_BOX_SHOT_LIST.md`, `PART1_AND_ONE_PROMPT_ROADMAP.md`, and the superseded shadow pitch are historical/timing references only; they must not override the director lock. Do not delete old reference assets/files; mark legacy material clearly.

## What the one-prompt agent must do without making the user write shot lists

- Parse the full supplied story into narration-aligned action beats, automatically adding motivated sub-shots as required. Derive storyboard, camera moves, actor/prop motion, transitions and SFX hits from the *verbs and consequences* in the story. Use the actual word times; no invented spoken timings.
- Build or reuse all mentioned environments and tangible objects **before** rendering. Missing market, multiple distinct alleys, cat bed, house, window, food, stool or crowd is a **production blocker**, never a generic substitute.
- Every narrated action must be physically acted: cat actually jumps, runs, nose-pushes, mouth-grips, pulls, watches, reacts, curls, rescues or tumbles. Pose placeholders and a generic still cat beside a box are not acceptable. Preserve original Mocha/Essie/Latte looks, original feline gait and contact geometry. Cats use muzzle/mouth/nose/paws, never human hands.
- Maintain persistent *prop identity* over all shots, especially Latte's striped box at the window, Essie's fully four-sided plain box, soft cat beds and final shared box. **Never shrink/hide a real box wall to make framing easier.**
- Use cinematic Episode 01 grammar: wide crane establish, grounded POV, closeup on reaction, motivated tracking/dolly/pans, depth-of-field for emotional distance, discreet impact shake. The city must feel inhabited. No static or repetitive action montages.
- Use Episode 01's actual local music source and clean intro-loop preset, not a replacement procedural chord pad. Keep accepted Episode 02 VO and SFX. Audio source rights must still be checked for publication.
- Implement changes in reusable components rather than per-frame random hacks. Keep the existing working Episode 01 source and paid assets untouched.

## Evidence-driven gates (never say a video is finished because a script exited 0)

1. Code-level director/source audit must pass; fail before expensive local full rendering on unmet location/object/action constraints. Episode 02: `npm.cmd run episode2:director-audit`; report `EP02_DIRECTOR_PREFLIGHT.json` and `EP02_REMAINING_WORK.md`.
2. TypeScript, Episode 01 style/source checks, spatial camera and box/prop tests must pass. Use **real Adam-aligned shot manifest**, including sub-shots, not stale scratch estimates.
3. Produce **actual moving** low-res shots at every action, transformation, contact, camera cut and rescue before trusting assembled MP4. Decode and compare with approved Episode 01 film. Inspect floor contacts, clipping/phasing, lens occlusion and real emotional clarity. Revise failed source and re-render only affected shots.
4. Local Windows machine performs native video renders. Remote GitHub code edits and GitHub CI cannot see that local render or replace actual creative review. Never claim a cloud test certified the real video.
5. Only after visual approval: create 1080×1920/30 master with approved Adam, SFX, and real Episode 01 music. Run encoded-file `release_quality_gate.py`, complete listening review, confirm music rights, obtain user signoff. No automatic publishing or paid requests.
6. If capabilities to autonomously see and repair footage are missing, say so explicitly. A single local `npm` command cannot author missing CGI animation from free-form text merely by running a renderer; that needs a connected coding/render/vision correction agent. Never imply that function is already implemented.

## Episode 02 production commands (Windows, from studio/)

- `npm.cmd run episode2:director-audit`: static creative/source gap gate, **no rendering**.
- `npm.cmd run episode2:preview-adam`: 540p narrated local preview *only once blockers are fixed*. Uses approved Adam, accepted SFX and required real music source. Does NOT request paid audio.
- `npm.cmd run episode2:build`: full local native export only once director/quality source checks pass.
- `npm.cmd run episode2:check`: final technical QA, **not** artistic approval.
- `npm.cmd run episode2:remix-preview`: change soundtrack from locally approved Episode 01 source using an already-rendered visual, **without re-rendering frames**. Requires the real source file at the Episode 01 preset path or `V2_MUSIC_FILE`.
