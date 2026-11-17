# Part 1 third real render — rejected; production approach changed

Status: **REJECTED / DO NOT USE**, 2026-11-17.
Evidence: the user uploaded `Part1_01-04_PREVIEW(2).mp4`, twelve individual actual render frames `01_20(2).png` through `04_80(2).png`, and `PART1_RENDER_STATUS(2).json`.

## Evidence, not assumptions

The box moved from the road to the sidewalk, but the **existing bus-stop shelter** now occupies the entire left side of nearly every shot. In shot 01 the guest is trapped behind the shelter's glass/bench and box side, and the supposed jump crosses hard geometry; shot 02 has an illustrated cat head floating above a pancake-like oval body inside an otherwise large hollow cardboard box; shot 03 is the same head sinking and fading while cardboard flaps fold, not a readable cat-to-box metamorphosis; shot 04 has the blue witness behind the glass/bench and the other two witnesses bunched at the opposite side. It has too much empty road foreground and none of the staging excitement of the approved Episode 01.

The JSON has **nine SUBJECT_CROP** warnings yet **zero streetlight hits and zero world blocker hits**, demonstrating another blind spot. A precise origin of this failure was found in Episode 01 source:
- `EpisodeWorld.busStop()` creates the shelter root at **(-4.4,0,5.8)**, with roof, glass panels, platform, bench and sign extending right from that root, toward x≈-2.95.
- The previous Episode 2 pilot positioned its box at **(-2.5,.04,5.35)** and the guest approached from **x≈-3.6**. Their footprints overlap the shelter. This should have been rejected by set occupancy **before artistic review**, not after a full render.
- `world.blockers` misses the shelter because it is mostly non-solid/transparent prop geometry. Center-point raycasts to designated streetlight groups are not sufficient to see such set dressing.

## Direct correction (source committed, not visually approved)

1. Stop the failing all-four-shots loop.
2. New proposed blocking for **Shot 01 only** centers the prop at **(1.8,.04,5.35)** on the clear sidewalk, away from the bus shelter and streetlight at x=0. The entry camera is revised. This new placement is **not visually confirmed**.
3. The pilot now checks real physical intersections with named bus-stop and streetlight scene groups, and multiple samples of set-to-camera occlusion, not only structural walls and one actor-center ray.
4. The local preview script accepts **`--shot01`**, renders only frames 0–26 (0.9 sec), exports six actual shot frames and a separate `SHOT01_QA.json`; reports blocking even when the composition itself runs without a JS/browser exception. The old four-shot render command still exists but is **not recommended** until shot 01 passes.
5. Source files for the changes: `PART1_SHOT_BLUEPRINT.json`, `Episode02Part1.tsx`, `episode02-part1.mjs`.

## Creative blocker not solved by moving the set

The cat animation is still a single **flat illustrated card**, with a rudimentary silhouette added for the curled pose. Its hop is positional interpolation and its paper transformation is a global scale/opacity effect plus a few painted facets. These cannot convey a nuanced, physical actor becoming a three-dimensional box. Even perfect camera framing will not create the desired quality.

**Required architectural redesign after staging test:** a reusable articulated 2.5D performer (separate head/body/front paws/rear paws/tail layers with grounded contact and turn/squash poses) plus an explicit transition animation with pose/shape correspondence (cat silhouette -> visible cardboard creases -> box skin/lid), all verified at real output size. The Episode 01 art direction and storytelling rhythm must be the reference; reuse its assets but stop treating generic idle drawings as full animation. No more claims that small code patches automatically meet Episode 01 quality.

## Single-prompt long-term goal

One prompt can direct the process only after there is a **reusable action library**, **set-placement validator**, **shot camera selector**, **local renderer**, and **actual video/image inspection/revision loop**. At present there is only a prompt-like shot blueprint and one-command render (not self-correcting). A realistic quality gate starts with one excellent fully approved shot, then expands to the rest.

## Next proof

Sync the v2-local-render branch; from `C:\V2\studio` run:

`node scripts/episode02-part1.mjs --shot01`

Review `out\v2-episodes\in-this-town-02\shot01-blocking-test\SHOT01_BLOCKING.mp4` plus `SHOT01_QA.json` and the six stills. This tests **staging and rough movement** only, not final character quality.

No new 4-shot render or final production until the new animation architecture is approved and has passed actual footage inspection.