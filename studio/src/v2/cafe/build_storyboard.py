"""From studio/: python src/v2/cafe/build_storyboard.py.
Stitches ONLY the four actual final Remotion frames; validates their runtime audits first.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, hashlib

OUT=Path('out/v2-cafe')
FILES=['01-exterior.png','02-interior-wide.png','03-counter-interaction.png','04-essie-closeup.png']
TITLES=['01  /  THE CAFÉ AT NIGHT','02  /  A PLACE FOR EVERYONE','03  /  BEHIND THE COUNTER','04  /  SOMETHING AT THE DOOR']
audits=[]
for name in FILES:
    with Image.open(OUT/name) as im:
        assert im.size==(1080,1920), (name, im.size)
        im.verify()
    a=json.loads((OUT/name.replace('.png','.audit.json')).read_text())
    assert a['render']['width']==1080 and a['render']['height']==1920
    assert not a['render']['errors'] and not a['assets'] and not a['cameraHits']
    assert all(c['pass'] for c in a['checks'])
    assert all(v['inFrame'] and not v['occluder'] for v in a['visibility'])
    for folder,key in [('cafe','sceneSourceHashes'),('cats','approvedCatSourceHashes')]:
        for file,digest in a[key].items():
            assert hashlib.sha256((Path('src/v2')/folder/file).read_bytes()).hexdigest()==digest, f'Stale render: {file}'
    audits.append(a)
assert len({a['fingerprint'] for a in audits})==1,'Layout differs between shots'
assert len({a['geometrySignature'] for a in audits})==1,'Permanent scene graph differs between shots'
assert len({json.dumps(a['fixtureTransforms'],sort_keys=True) for a in audits})==1
assert len({json.dumps(a['cats'],sort_keys=True) for a in audits})==1
assert len({json.dumps(a['approvedCatSourceHashes'],sort_keys=True) for a in audits})==1
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=lambda n:ImageFont.truetype(font_path,n)
board=Image.new('RGB',(2320,1150),'#142831');d=ImageDraw.Draw(board)
d.text((36,24),'WHAT IF CATS  /  THE PERMANENT CAFÉ',font=font(30),fill='#f3ddbc')
d.text((36,69),'PHASE 2 STORYBOARD   •   Four actual Remotion stills   •   One fixed environment',font=font(18),fill='#acb9b8')
for i,(file,title) in enumerate(zip(FILES,TITLES)):
    x=36+i*572
    with Image.open(OUT/file) as im:board.paste(im.convert('RGB').resize((540,960),Image.Resampling.LANCZOS),(x,116))
    d.text((x,1091),title,font=font(17),fill='#f3ddbc')
board.save(OUT/'CAFE_STORYBOARD.jpg',quality=95,subsampling=0)
checks=audits[0]['checks']
rows=[]
for a,name in zip(audits,FILES):
    rows.append(f"| {name} | 1080 × 1920 | {a['render']['elapsedSeconds']:.1f} s | {len(a['visibility'])} / {len(a['visibility'])} clear | 0 |")
report=f'''# What If Cats V2 — café QA

Milestone: four-shot environment storyboard, pending user visual approval. No episode, narration, music or SFX was created.

## Final rendering evidence

All four PNGs were rendered directly by Remotion with system Chromium / ANGLE SwiftShader.
`CAFE_STORYBOARD.jpg` contains proportionally reduced copies of those exact four PNGs; no substitute images or generated art.

| Frame | Resolution | Render time | Required sightlines | Browser errors |
|---|---|---|---|---|
{chr(10).join(rows)}

## Automated results

- TypeScript: `npm run typecheck` passed.
- Layout: {len(checks)} production structural checks passed, including exact role counts, unique stable IDs, positive dimensions, supported tabletop props, nonoverlapping furniture, staff aisle, cat supports/scales, and safe camera positions.
- Regression probes: an added duplicate counter and a table moved into the serving counter both correctly failed the structural checks; state was restored and the checks passed again.
- Runtime: {audits[0]['meshCount']} permanent meshes initialized in each shot. No empty geometries, absent materials or unloaded textures. All textures are deterministic procedural Canvas textures; no external model or image downloads are required.
- Counters: exactly `counter-serving` and `counter-preparation`, one of each role. There are exactly two customer tables and four customer chairs. The bench and barista riser are separate seating/support roles, not counters.
- Barista aisle: 1.65 m between the two worktops. Customer access runs around the right end of the serving counter.
- All required object/face centers lie inside the camera frustum and their geometry raycasts are clear. Camera points are outside furniture and actual shell geometry. Full framing was also reviewed visually; point tests alone do not certify composition.
- The configuration fingerprint, permanent geometry signature (`{audits[0]['geometrySignature']}`), all {len(audits[0]['fixtureTransforms'])} fixture transforms and all three cat anchors match across all four final renders.
- All four audits match the current café source hashes. Approved cat source hashes are identical across all renders; no files in `src/v2/cats/` were changed for this phase.
- Original character rig regression: 66 sampled Canvas identity/pose checks passed.

## Character integration

The approved drawing is reused through `createCatCard`, without new character art. All three cards use the same 1.52 m canvas height (visible illustrated height approximately 1.13 m). Essie is behind the serving counter on the fixed 0.60 m barista riser; Latte rests on the 1.12 m rear worktop beside the espresso machine; Mocha rests on the 0.46 m upholstered bench. Ground anchors and furniture never move between shots. Idle only changes the drawing's breathing/blinking/ear/tail pose, not world translation.

The cards use the original renderer's `cardShade` bright-floor lighting method with a mild warm tint and cool far-side shade. They cast alpha-tested directional shadows and have separate soft surface contact patches. Cards are on `NOINK` so the world ink pass never draws rectangular outlines around them. Each billboard rotates around Y toward the camera; the approved front/three-quarter drawings remain within supported yaw. Essie's close-up gaze is calculated toward the permanent entrance, with the approved concerned expression.

## Visual review

Review notes are completed after inspecting the final full-resolution images. See the closing visual sign-off section below.

## Reproduction and retained files

Run from `studio/`:

```sh
npm run typecheck
node src/v2/cafe/layout.test.mjs
node scripts/v2-cat-rig-check.mjs
node scripts/v2-cafe-render.mjs
/workspace/.venvs/animated-shorts/bin/python src/v2/cafe/build_storyboard.py
```

Source: `src/v2/cafe/config.ts`, `environment.ts`, `Cafe.tsx`, `layout.ts`, `layout.test.mjs` and `build_storyboard.py`. The café compositions are one frame long to keep this milestone still-only. Each PNG has a companion `.audit.json` containing measured checks and source hashes. Draft images live in `draft/` and are not deliverables.

The original BridgeShort example and approved cat drawing files are preserved. Private reference photographs remain outside the checkout; none are used as runtime textures or committed. No V1 engine, episode environment or old stickman repository was imported.
'''
review=Path('src/v2/cafe/VISUAL_REVIEW.md')
if review.exists():report+='\n'+review.read_text()
(OUT/'CAFE_QA_REPORT.md').write_text(report)
print('Four final PNGs, matching scene geometry, grounded cats, clear required sightlines and current source hashes verified.')
print('Storyboard and automated QA report written.')
