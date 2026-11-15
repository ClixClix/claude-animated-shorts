# The Door at 11:11 — current local review pass

The separate `InThisTownTheDoorAt1111Polish` composition preserves the original episode, approved lead drawings, permanent cafe configuration, narrator settings, cached audio and existing finished movies. All scene/video rendering remains on the Windows PC.

The edit follows the continuous approved Adam recording: **3,349 frames / 111.63 seconds / 80 cuts at 30 FPS**. The longest shot is 105 frames (3.5 seconds). All **364 caption cards contain one word**. No silence is inserted between narration lines; the only padding is less than one frame at the end. The decoded narration stem is checked sample-for-sample against the cached recording.

## Changes prompted by the uploaded movie

The uploaded `Polish_Narrated_Review_540p.mp4` was decoded and visually reviewed in contact sheets covering the complete movie. These times refer to that uploaded movie, not proof of the revised pixels:

| Uploaded time | Problem observed | Source correction |
| --- | --- | --- |
| 0–12 seconds | Obstructed opening, generic mystery view, overbright block-like streetlights | Higher city approach, confused-cat reactions, framed lantern housings, continuous streetlight pan followed by the house |
| 26–40 seconds | Detached walking legs, bare home, blackout aimed at cafe, unreadable clock | Hip-anchored leg projection, visible bed/bowls/tower/wall art, street-facing blackout views, four-faced analog clock tower |
| 42–74 seconds | Early occupants visible, rigid blanket, unclear approach, open door during failed reach | Opaque window/door panes, hidden opener, crouch under cloth dome, alley-to-door staging, closed-door kitten jump and synchronized handle tilt |
| 80–94 seconds | Cloth/ground contact and diagonal entrance route; follow shot unclear | Blanket support heights, kitten enters first, centered Latte route, interior follow view leading to flowerpot, then Latte and the readable sign |
| 98–111 seconds | Bus composition, arbitrary crates, foreground guest blocking leads, cafe shown for dark street | Closer departing bus, functional alley dumpster, guests settled before final close-up, views of other dark buildings, friendly duo finish |

Connected roads, extended ground, curb lines and detailed city blocks replace scattered infill. The clock tower has an illuminated circular analog face with hour/minute hands, masonry bands, cornice and spire; every view uses the same clock. The home-window move checks the whole clock face through the actual opening. The OPEN plaque is mounted on a stationary pier clear of the moving door. Window opacity, sidewalk elevations and lower lantern output address transparency/floor artifacts and glare.

Street walkers and cars are present before curfew and clear before the suspense section. Car headlights include a light pool. Ending guests follow continuous entrance routes; the dumpster cat is the same cat that later emerges. The recalled opening and light-switch inserts hide present-time guests and carried props, so they cannot appear stranded in the earlier event. Cafe furniture and the three approved lead drawings remain unchanged.

The latest requested streetlight direction is a **pan → house → Latte**, replacing the older nine jump-cut plan. Taps are **cafe → Latte → empty street**. The sign stays visible while its invitation is spoken. The original recording controls the pacing throughout.

## Run on Windows

Close Remotion Studio, then run these commands in PowerShell, one line at a time:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
.\Preview-Polish.cmd
```

The preview command prepares timing offline, checks the story, renders each shot locally at **540×960**, and assembles the full narrated review with captions. Matching complete shot caches resume; changed source/props invalidate earlier polish clips. Original movies and private assets are preserved.

The current review has a version-specific name, `Polish_Review_<source-hash>_540p.mp4`, and source/props metadata. `PREVIEW_QA.json` records its exact path; Explorer selects this file after completion. The canonical `Polish_Narrated_Review_540p.mp4` is also refreshed for compatibility. Outputs are under `studio/out/v2-episodes/door-at-1111-polish/`.

After picture approval, `Render-Polish.cmd` runs native 1080×1920 rendering and the separate music/Foley finishing stages. Narration synthesis is never called by either command.

## Verification and limits

TypeScript, cafe layout, original animation, narration and original-episode regressions pass. Polish tests cover timing, deterministic transforms, planted feet, narration continuity, single-word captions, hidden early kitten, closed-door reach, mouth-to-bowl contact, doorway routes, shelter continuity and protected asset hashes. A separate leg projection test verifies both fixed hips and exact foot targets.

The all-frame geometry preflight initializes the actual Three.js environment and checks all 3,349 camera states without drawing scene frames. It checks camera collisions, required subject visibility, full clock-face bounds, at least two other buildings in dark-street views, textures, vehicle separation and mouth/cloth contact. It is not a pixel-quality approval; character alpha occlusion is checked during actual local rendering.

A supplied viral reference frame was inspected for room geography, grounded subjects and warm/cool separation. The reference shorts and `references/reports/motion.md` remain the local quality benchmark. This revision is **not claimed to match their visual quality until actual playback is reviewed**.

No revised scene frames or movie were rendered in the cloud. End-to-end Windows rendering, the new preview assembly and revised acting/framing require local visual and listening approval. Check the complete version-stamped movie, especially the tower through the window, the unknown opener, blanket silhouette, kitten/Latte threshold order, bus departure and final unobstructed duo. Record findings in `studio/out/v2-episodes/door-at-1111-polish/VISUAL_INSPECTION_NOTES.md`.
