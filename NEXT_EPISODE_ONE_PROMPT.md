# In This Town — future episode starter (one story prompt)

**Audience: creator / next-episode coding agent.** Source: root AGENTS.md, ONE_PROMPT_IN_THIS_TOWN.md, and Episode 01 locked world/character/style modules. Do not create a parallel look, random underscore or new principal character rigs.

## Morning: Episode 02 source verification

In a Windows checkout on branch `v2-local-render`, double-click **Morning-Episode02-Verification.cmd** at the repository root. It syncs GitHub, runs the new one-prompt regression tests, TypeScript and the strict Episode 2 director check, then shows production status. It does not pay for narration, publish, or start a video render unless deliberately launched with the `--preview` argument.

After all source checks pass, the intentional *local preview* command from the studio folder is:

```powershell
cd C:\V2\ep02-local-render\studio
npm.cmd run episode2:preview-adam
```

Episode 02 already has approved Adam voice and Foley. The preview uses the **real Episode 1 series music** (Numbers — Instrumental Intro Loop) from the Episode01 preset. This must be locally present at `%USERPROFILE%\WhatIfCatsPrivate\audio\temporex-numbers-intro.mp3`, or point `V2_MUSIC_FILE` at the creator's approved existing source. Do not automatically synthesize or replace it. **Publishing rights remain a separate check.**

Never call an output uploadable solely because a render, TypeScript or CI run passes. Review actual movie motion/acting and final mix, and only then attempt full 1080×1920 export plus release QA.

## Next episode: one normal story, not a manually typed shot list

Write one story in a plain-text file, including only what happens (e.g. a short narration/story). Double-click **Prepare-Next-InThisTown.cmd** after dragging the text file onto it, or run this from `studio/`:

```powershell
npm.cmd run inthis:next -- --story-file "C:\Stories\next-episode.txt" --title "Episode 3 Title"
```

This **automatically** creates a non-destructive folder `studio/production/<episode-slug>/` with:

- `USER_STORY.txt` — unchanged user words
- `EPISODE_PLAN.json` — original story hash, automatically identified character/location/prop continuity, initial visual beats and camera intentions
- `SHOT_BLUEPRINT.json` — explicit per-beat required visible actions, contact and continuity tests, source paragraph links, and unimplemented animation/camera placeholders
- `ASSET_REQUIREMENTS.json` — physical locations and props needed before any render
- `PRODUCTION_STATUS.json` — accurate readiness flags (no false creative signoff)
- `README.md` — approved production stages and limits

Files are never overwritten; a duplicate slug causes a safe error. To verify the planner itself without touching episodes:

```powershell
npm.cmd run inthis:next-test
```

## The production coding agent's work after the initial storyboard

1. Reuse the Episode 01 source identity/style lock; map the draft beat plan into **actual** scene and character animations, camera keyframes and named physical props. Resolve story context instead of blindly trusting keyword-based splits.
2. Do source and geometry preflight. Reject missing set pieces (market, house, bed, alleys), wrong box identities, floating paw positions, clipped cameras and mismatched actor geography before an expensive render.
3. Produce low-cost **moving** shot previews for every transformation, contact, rescue and transition, inspect frames against the Episode 01 final film and rework failures. Maintain one error ledger.
4. Use real, separately approved narration plus actual word alignment to lock each edit. A future episode needs its own voice; the Episode 2 Adam take cannot simply be re-used.
5. Mix creator-approved SFX and actual cleared series music. Run encoded master QA. Require creator signoff on the movie and rights before publishing.

**What is NOT automatic yet:** This tool does **not** generate finished Three.js/Remotion animation source from arbitrary story prose or understand/revise its own rendered video. Those steps still require an agent with source editing, actual local rendering and footage inspection permissions. Do not call it a finished one-prompt CGI movie factory or imply the creator can get a high-quality master merely by running the planner.

## Repository design for no drift

The creator supplies one ordinary story. The agent, not the creator, generates and implements the shot plan, and inherits the pinned character designs, location registry, audio identity, feline behavior rules, and QA criteria in `AGENTS.md`. Episode 02 has an additional user-authoritative file `studio/src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json`: never replace it with old draft shot sheets. Every episode must preserve the exact user's latest creative requirements above any inferred shot plan.
