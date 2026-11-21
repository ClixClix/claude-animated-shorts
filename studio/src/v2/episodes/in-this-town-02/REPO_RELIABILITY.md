# Episode02 repository reliability repair

The uploaded Updated Full Review is a full 540x960, 30fps, 3,737-frame film. Its live edit has 62 segments across 60 beats. Most requested staging changes are present. The remaining reliability problems were in several independent workflow paths, not evidence that a different language model would eliminate them.

## Confirmed causes and changes

- The renderer used a manual source hash list that missed imported storyDirection, directedSet, boxStaging and worldStaging. It now hashes the actual composition import graph, render settings, installed renderer versions and props. Altered, stale, wrong-mode or corrupt segments are rejected.
- Assembly only required segment hashes to agree with one another. It now requires every clip to match the current source and live edit, then checks encoded frame count, size, fps and duration before replacing the visual movie.
- Several audits sampled the old 3,876-frame scratch and obsolete shot actions. Action/finale checks now use the actual narration-aligned segments and current render-time transforms. Bed visibility probes include torso/paws as well as face rays. Distinct search alleys now have distinct landmarks.
- The old local-full-review command explicitly prepared a silent scratch. The replacement never prepares an edit or audio: it checks existing inputs together, runs one shared source-check list, resumes the existing renderer, assembles, adds the unchanged full mixed soundtrack and validates the resulting movie. Previous review movies are retained with timestamped names.
- Multiple contradictory instructions and commands encouraged repeated handoffs. Root instructions now identify the current review entry point and the creator's full-video review choice.

## Local use

From `C:\V2\ep02-local-render\studio`:

```powershell
npm.cmd run episode2:review -- --open
```

Optional `npm.cmd run episode2:doctor` runs preflight only. `npm.cmd run episode2:workflow-test` runs the regression tests. `--force` deliberately rerenders all segments. Ordinary reruns reuse only valid matching cache entries. `build-preview` without explicit scratch flags also routes to this review workflow.

The first render after this repair must replace old cache entries because their source identity was incomplete. This is expected. Do not run old update installers over the new workflow. A stopped run retains completed matching segments and the previous complete review.

## Evidence and remaining limits

Verified in this checkout: TypeScript, 25 style checks, director preflight, 1,470 box/fixture checks, 30 action checks, 29 finale transform checks, 550 real-mesh visibility probes and seven cache/mux regression tests. The mux regression uses synthetic color/tone media in temporary folders, never the private episode assets. It verifies unchanged picture packets, unchanged source audio, exact format/frames and retention of the previous movie after a failed replacement.

The real local full command still needs execution against the creator's private narration metadata and mixed soundtrack. They are absent in this cloud checkout; doctor reports them together and stops before rendering. No new scene movie was rendered in cloud, no audio was regenerated and no publication occurred.

Actual uploaded footage still showed chair obstruction at the bed and clutter near the top of shot57. The bed camera source was adjusted and body probes pass, but that new camera still needs local video inspection. Shot57 and all final moving contacts remain creative-review items. Numerical ray/root probes do not certify every pixel of painted cat artwork or every continuous collision. Audio was not listened to during this repair.

This repairs the current Episode02 render/review workflow. Arbitrary-story one-prompt filmmaking still needs a locally connected agent that implements missing acting and repeatedly inspects actual footage; that capability is not supplied by an npm alias. Do not promise zero artistic errors or mark source checks as visual approval.
