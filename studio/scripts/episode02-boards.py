#!/usr/bin/env python3
"""Generate actual-film contact sheets and critical-motion review prompts.

Runs ONLY during user-requested post-build batch QA. No renderer/API calls.
"""
from __future__ import annotations
from pathlib import Path
import json,subprocess,math,io
from PIL import Image,ImageDraw,ImageFont
OUT=Path('out/v2-episodes/in-this-town-02')
manifest=json.loads((OUT/'EP02_SHOT_MANIFEST.json').read_text(encoding='utf-8'))
status=json.loads((OUT/'EP02_FINISHING_STATUS.json').read_text(encoding='utf-8'))
video=Path(status['outputs'][-1]['file'])
if not video.is_file():raise FileNotFoundError(video)
shots=manifest['shots']
CHILD_W,CHILD_H=180,320
thumbs=[]
for shot in shots:
    frame=shot['start']+(shot['end']-shot['start'])//2
    at=frame/30
    raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-ss',f'{at:.4f}','-i',str(video),
      '-frames:v','1','-vf',f'scale={CHILD_W}:{CHILD_H}:flags=area',
      '-f','image2pipe','-vcodec','png','-'],stdout=subprocess.PIPE,check=True).stdout
    image=Image.open(io.BytesIO(raw)).convert('RGB')
    thumbs.append((shot,image))
columns=6
rows=math.ceil(len(thumbs)/columns)
sheet=Image.new('RGB',(columns*CHILD_W,rows*(CHILD_H+28)),(23,29,41))
draw=ImageDraw.Draw(sheet)
for i,(shot,photo) in enumerate(thumbs):
    x=(i%columns)*CHILD_W;y=(i//columns)*(CHILD_H+28)
    sheet.paste(photo,(x,y+28))
    label=f"{shot['id']} {shot['act'][:10]}"
    draw.text((x+4,y+5),label,fill=(249,241,218))
path=OUT/'EP02_ACTUAL_FRAME_CONTACT_SHEET.jpg'
sheet.save(path,quality=91,optimize=True)
critical=[3,13,20,32,35,38,39,49,50,51,54,55,57,60]
lines=[
'# Episode 02 — Final encoded movie: creative and contact review',
'',
f'- File: `{video}`',
f'- Frames in intended edit: {manifest["durationInFrames"]}',
'- **Not a claim of approval.** Manually review the final encoded movie on phone and headphones.',
'- For the high-risk segments below, review *consecutive actual frames*, not only the contact sheet.',
'',
'## Review this exact movie, then sign off',
'',
'| Shot | Action | What must be visibly verified | Approved by human? |',
'| --- | --- | --- | --- |',
]
for number in critical:
    s=shots[number-1]
    note=(
        'Continuous cat-to-box / box-to-cat silhouette, box position, safe contact' if number in [3,38,39,50,51,55] else
        'Mocha's paws inside the correct box; realistic contact and camera clearance' if number in [49,54] else
        'No clipping, repeated frames, missing character, drifting camera or inaccurate sound beat'
    )
    lines.append(f'| {s["id"]} | {s["narrationAnchor"]} | {note} | [ ] |')
lines+=['',
'## Whole-film watch-through','',
'- [ ] Hook comprehensible by 0:04 and synchronized with actual narration',
'- [ ] No café, alley or sidewalk floor intersections, clipping or dark unreadable action',
'- [ ] Strong Mocha/Latte/Essie characterization and emotional progression',
'- [ ] Three distinctive box identities and fixed location continuity',
'- [ ] No unnecessary dead frames or unmotivated camera motions',
'- [ ] Accurate, readable one-word subtitles timed to spoken sounds',
'- [ ] 60 distinct shots all shown; ending has room for three supported cats',
'- [ ] Timed original comedic SFX hits and balanced music under narration',
'- [ ] No unlicensed third-party music or assets; verify voice rights',
'- [ ] Exact final encoded MP4 passes the technical release gate',
'- [ ] Confirmed phone playback and headphone listen, no motion discomfort',
'',
'**Result:** PENDING — manual creative and music/rights approval still required.']
(OUT/'EP02_CREATIVE_REVIEW.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'contactSheet':str(path),'review':str(OUT/'EP02_CREATIVE_REVIEW.md'),'actualSampledFrames':len(thumbs),'highRiskShots':critical}))
