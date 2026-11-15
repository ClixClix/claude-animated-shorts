# The Door at 11:11 — final major review candidate

This source pass responds to the actual uploaded `Polish_Review_e9c6b388_540p.mp4`. Frames across its full duration and consecutive walking/entrance/ending frames were inspected, along with samples from three supplied reference shorts. The changed pictures below still require an actual local render and visual approval.

The separate `InThisTownTheDoorAt1111Polish` composition preserves the original composition, permanent cafe fixtures, three lead drawings/palettes, narration configuration and cached recordings. Scene/video rendering remains on the Windows PC. No paid narration is generated.

## What changed

- **City scale:** 76 additional configured buildings form districts around the original town, with connected road corridors, crossings, curbs, foundations, doors, varied heights/rooflines and batched framed windows. The opening establishes these districts before the rush-home cut. Extended ground and distance fog support the skyline; stars cover the sky and remain visible through atmospheric fog.
- **Walking:** the previous flat-card foot projection was fundamentally wrong for close perspectives: the projected paws could lie below the floor and be clipped. Walking now uses four separate articulated leg cards with actual world-space hips and planted toes. They reuse the approved leg silhouettes, colors, sock sizes and ink. The approved torso/head drawing is retained; its exaggerated walking squash is reduced. The rig includes planted paw shadows, body weight shift and camera-relative profile selection. A new walking bout starts its own gait, so a turn after a long pause cannot inherit planted paws facing the previous direction.
- **Composition:** the rush-home view clears the central pole; the walking/slip and home-exit cameras track the subject at safe distances. The follow/entrance and guest shots clear the doorway piers and foreground table. The bus departure is seen from a lower front-quarter angle, with full-vehicle bounds checked. The final duo is framed from inside beside the doorway rather than behind its frame.
- **Suspense:** Essie and seated patrons are hidden before the reveal, as well as the already-hidden opener and kitten. The door still opens from closed, closes for the kitten's unsuccessful reach, and opens for the eventual entry. The clock-window move clears the entire analog face and roofline; the clock tower remains one stable landmark.
- **Light and surfaces:** cooler directional night light, reduced flat ambient fill and lower front-window spill retain readable dark surfaces and control the large bright pane. Street and facade materials gain restrained painted grain; windows have frames and tonal variation. Lead cards take a cool street tint or warm cafe spill. The same cinematic ink, bloom and grading pipeline is retained.
- **Acting:** closed-mouth concern, startled reactions, searching glances, fear and relaxed final attention replace the nearly constant open-mouth fear pose. Crisp approved expressions replace dissolves that doubled facial lines. Blinks are more frequent, with a blink at the startled-to-listening change. The home bed is clear of the foreground reaction view, and carried cloth gets soft folds.

The narration remains **3,349 frames / 111.63 seconds / 80 cuts at 30 FPS**, with a maximum shot length of 105 frames (3.5 seconds). All **364 caption cards show one word**. The cached Adam recording is continuous; no gaps or additional speed adjustment are inserted. Original finished movies and private assets are preserved.

## Local command

Close Studio and previous review players. Run each line separately in PowerShell:

```powershell
cd C:\V2
powershell -ExecutionPolicy Bypass -File .\Update-Local-Code.ps1
.\Preview-Polish.cmd
```

The command prepares timing offline, checks source/rig invariants, renders locally at **540×960**, then assembles the narrated review. It renders the previously troublesome city, walk, clock, door, entrance, bus and ending shots first. Offscreen Canvas tests check repeated frames in different orders with a fixed rasterization mode. Actual per-frame audits stop the render if a critical subject is blocked/outside the frame, the camera enters geometry, or a character is revealed early. This catches defined failures; it does not judge animation quality or replace visual review.

Valid matching clips resume. Changed visual source invalidates prior polish clips. No original episode outputs are deleted. The version-stamped output is `studio/out/v2-episodes/door-at-1111-polish/Polish_Review_<source-hash>_540p.mp4`; `PREVIEW_QA.json` records its exact path, and Explorer selects that movie after completion. The canonical preview filename is also refreshed.

After visual approval, `Render-Polish.cmd` performs native 1080×1920 rendering and separate music/Foley finishing using the existing authorized assets. Neither command generates narration.

## Evidence and limits

TypeScript and the existing cafe, animation, narration and original-episode regression suites pass. Polish timing/story checks preserve continuous narration samples, single-word captions, deterministic transforms, planted feet, doorway routes, hidden early reveals, cloth/mouth and bowl/mouth contact, and 44 protected asset hashes. Additional rig/city checks verify real toe/hip anchors, finite leg geometry, reasonable reach, stable IDs and buildings clear of road corridors. The actual Three.js world passes geometry checks across all 3,349 frames, including camera/body clearance, required subjects, full clock/bus bounds, city coverage and other-building blackout views.

These are technical checks. The new scenes, lighting, acting and foot contacts must be judged from the actual version-stamped Windows movie against the references. No revised scene still or video was rendered in the cloud; source bundling, offscreen Canvas API tests and geometry evaluation do not establish visual approval. This is the intended final major pass, not a claim that no small cleanup can remain.
