"""Consecutive-frame evidence from actual Remotion videos, never interpolated stills."""
from pathlib import Path
import json,subprocess,sys
from PIL import Image,ImageDraw,ImageFont

root=Path('out/v2-episodes/door-at-1111-polish')
native='--native' in sys.argv
source=root/('segments' if native else 'motion')
ids=['04','20','26','27','28','31','34','39A','39B','40','41','47','48','49','50A','50B','51','53','54','55','57A','57B','58A','58B','58C','58D','59A','59B','59C','60B']
font=ImageFont.truetype(str(Path(__file__).resolve().parents[1] / 'assets/fonts/DejaVuSans.ttf'),16)
for shot in ids:
    file=source/(shot+'.mp4')
    if not file.exists():continue
    info=json.loads(file.with_suffix('.json').read_text())
    count=info['range'][1]-info['range'][0]+1
    indices=sorted(set(round(i*(count-1)/5) for i in range(6)))
    if shot=='47' and count>30:
        cues=json.loads((root/'render-props.json').read_text())['cues']['taps']
        peak=max(f for f in cues if info['range'][0]<=f<=info['range'][1])
        indices=[max(0,min(count-1,peak-info['range'][0]+offset)) for offset in [-6,-3,0,3,6,12]]
    if shot=='53' and count>30:
        ground=next(a['frame'] for a in sorted(info['audits'],key=lambda a:a['frame']) if abs(a['bowl'][1])<1e-6)
        indices=[max(0,min(count-1,ground-info['range'][0]+offset)) for offset in [-9,-4,0,4,10,20]]
    sheet=Image.new('RGB',(270*len(indices),525),'#152536');draw=ImageDraw.Draw(sheet)
    for i,index in enumerate(indices):
        data=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-vf',f'select=eq(n\\,{index}),scale=270:480','-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'])
        from io import BytesIO
        image=Image.open(BytesIO(data)).convert('RGB');sheet.paste(image,(i*270,25))
        draw.text((i*270+6,505),f"{shot} / frame {info['range'][0]+index}",font=font,fill='#eed8ae')
    draw.text((8,3),'NATIVE FINAL' if native else 'CONSECUTIVE MOTION GATE',font=font,fill='#eed8ae')
    sheet.save(root/(('native-motion-' if native else 'motion-gate-')+shot+'.jpg'),quality=94)
print('Actual motion filmstrips saved.')
