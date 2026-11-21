> **Current workflow (November 21, 2026):** For the existing Episode02 edit, run `npm.cmd run episode2:review -- --open` in the local studio. It checks the current source, renders/resumes the full live edit, reuses the existing soundtrack and validates/opens the exact updated review. `episode2:doctor` checks readiness without rendering. This replaces older Episode02 preview entry points below. One creative prompt for an arbitrary new film still requires a connected coding/render/vision correction agent; the draft planner alone does not implement that loop. See [AGENTS.md](AGENTS.md) and [reliability findings](studio/src/v2/episodes/in-this-town-02/REPO_RELIABILITY.md). Older command lists and fixed scratch-frame descriptions below are historical.

> **CURRENT AGENT ENTRYPOINT (18 Nov 2026):** Read [AGENTS.md](AGENTS.md), the exact [Episode 02 director lock](studio/src/v2/episodes/in-this-town-02/PRODUCTION_DIRECTOR_LOCK.json), and the Episode 01 style lock. Do not use the old draft shot list as creative authority. The new `episode2:director-audit` blocks obvious missing scenes and `episode2:build` is prevented from wasting a full local render on them. The fully autonomous text-to-complete-film agent is STILL NOT BUILT; it requires running/inspecting/repairing actual local video. The source cleanup does not certify Episode 02.

# One-prompt production target — In This Town (Episode 01 locked reference)

## Single-prompt creative interface (target)

An eventual local vision-and-rendering agent should accept a single natural-language request:

> Make the next **In This Town** episode from this approved story: [story]. Follow the locked Episode 01 series style, cast, props and world geometry. Stage all cat actions with mouths, noses and natural paws, not human hands. Produce script, camera/character shot plan, real rendered previews, and automatically revise shots that fail actual-frame quality inspection. Once every shot is visually approved, make a native 1080x1920/30 fps H.264/AAC master with approved/licensed audio, run final encoded-file QA, and present the result for human creative and rights signoff. Never request paid narration or publish without explicit permission.

The normal user request should NOT need to repeat camera numbers, shader values, palette colors, shot continuity rules, or the three main character designs: the series lock provides these.

## Immutable Episode 01 style and assets

- Original reviewed film: **The Door at 11:11**, SHA-256 `78f621b454e84214f1d0b3e244e7cb9e44ae49b5c9f571c649560eb680179374`.
- Source+visual lock: `studio/src/v2/series/IN_THIS_TOWN_STYLE_LOCK.json`. This has 14 exact Git source blob identities for original character drawings, walking legs, kitten, world, café, shaders, and Episode 01 composition.
- Shared renderer settings: `studio/src/v2/series/episode1Style.ts`, imported by **Episode 02's actual production composition**.
- This style belongs to **In This Town's narrated mystery**. It does not force the shorter, faster What If Cats café-comedy style onto mystery episodes.
- Keeping the same code/grade is a necessary baseline, **not visual proof**. A 9:16 shot can be technically legal while the box hides the cat, the alley camera hits a wall, or the emotion fails.

## What exists in GitHub now

1. **Style fidelity preflight** — `studio/scripts/episode02-style-preflight.mjs`. Compares the local original Episode 01 source against approved locked Git blobs. Verifies the current Episode 02 uses `createEpisodeCat`, actual Episode 01 world/kitten/extras, original style constants, animal-only actions, and story box continuity. Optional `--reference "C:\path\to\approved-episode01.mp4"` checks the exact reference video SHA-256.
2. **Low-cost real visual proofs** — `studio/scripts/episode02-episode1-assets-preview.mjs`. Runs style lock and TypeScript preflight, renders 14 actual 540×960 frames from Episode 02 (not a full film, no paid calls).
3. **Review packet** — `studio/src/v2/episodes/in-this-town-02/VISUAL_APPROVAL_QUEUE.json` and `studio/scripts/episode02-review-sheet.mjs` produce `EP2_STYLE_REVIEW.html` plus a machine-readable packet with actual frames, shot IDs, problems and **pending** visual approval. The queue records the user's last 14 screenshot findings.
4. **Future automation contract** — `studio/src/v2/series/ONE_PROMPT_PRODUCTION_CONTRACT.json`. This is a ten-stage structured interface for a future production agent, including script, storyboard, geometry, source, previews, visual correction, audio, final encode and signoff.
5. **Final technical gate** — `studio/scripts/release_quality_gate.py` validates the encoded master; see `QUALITY_BASELINE.md`.

## Where we are NOT yet autonomous

A single prompt cannot yet produce a professionally finished Episode 02 because there is **no local computer/renderer control from this chat, no agent that watches its own rendered videos, no reliable automated camera/prop collider to approve acting, and no completed box-to-cat transformation library**. Do not describe those as implemented. An automation agent will need local execution permissions, a feedback loop that can see **actual** frames, and ability to stop/rewrite/regenerate only failed shots. Artistic signoff must remain explicit.

It is **not enough** to generate a storyline or prompt. The future controller should be able to read a broken shot, adjust poses/cameras/prop staging, render a new clip, inspect it against Episode 01, and avoid altering the core designs.

## Current Episode 02 frame review priorities

- Shots 05 and 12: meaningful intro / nose-to-box framing, not large empty road or half a cat.
- Shots 19–20, 32, 37: cats must visibly interact with boxes, no awkward overlaps or missing mouth contact.
- Shots 49–55: physically plausible rescue and reveal, Essie restored **before** Latte.
- Shots 59–60: **one** box, all three cats in a closer, warmer three-quarter cuddle with readable faces. The overhead proof is not yet an emotionally successful ending.

No sample screenshot is marked creatively approved. A better-looking costume or reused Episode 01 shader does not mean the overall scene matches the final Episode 01 MP4.

## Repeatable source audit after EACH correction

The source now has a deterministic quality-cycle command:

- `npm.cmd run episode2:code-audit`: locks the **exact Episode 01** source, runs TypeScript, checks original café geometry, box dimensions and feline behavior, then directly bundles the **real Episode 02** camera/timeline source with esbuild and inspects the 3,876 actual timeline states. Detailed ending tests look for shot 58–60 teleports, frame cropping, box-wall intersection, one final box and original character preservation. Saves `EP2_REPEATABLE_CODE_AUDIT.json`.
- `npm.cmd run episode2:visual-cycle`: performs those checks, then renders the 14 representative real Episode02 PNGs plus **11 extra frames sampled across the Mocha box-entry and cuddle**; updates the local HTML/JSON review packet. Does **not** auto-approve the actual animation.
- The exact approved Episode01 final MP4's SHA-256 was verified separately against the local copy on 2026-11-17, matching the established SHA lock. This proves the baseline identity, not visual parity of a different movie.

**No 99% artistic-confidence claim is possible from code review alone.** The cycle deliberately records `artisticReviewComplete=false` and no visual parity score. The full animation, especially the magical cat-to-cardboard transformation, remains unapproved until real moving footage is rendered and inspected side by side.

## Local verification (Windows)

Sync with `C:\V2\Update-Local-Code.ps1`, then run from `C:\V2\studio`:

```powershell
npm run episode2:style-check
npm run episode2:style-preview
```

The second command makes the style report, preview PNGs, `EP2_STYLE_REVIEW.html`, and `EP2_STYLE_REVIEW_PACKET.json` in `out\v2-episodes\in-this-town-02\ep1-asset-reuse-proof\`. The lock report is in `out\v2-episodes\in-this-town-02\series-style-qa\`.

When actual Episode 01 final MP4 path is available, run the style check separately with `node scripts/episode02-style-preflight.mjs --reference "C:\path\to\approved-episode01.mp4"` to confirm the exact movie reference.

**These preflight operations cannot make an unreviewed film on brand.** Review the generated stills and then the moving segments; do not run the full Episode 02 until the problem shots have been rebuilt, visually examined and approved.
