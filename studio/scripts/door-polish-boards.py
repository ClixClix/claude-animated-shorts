from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,sys
root=Path('out/v2-episodes/door-at-1111-polish');plan=json.loads((root/'The_Door_At_1111_Polish_Shot_Manifest.json').read_text());draft='--draft' in sys.argv;source=root/('draft-storyboard' if draft else 'storyboard')
font=ImageFont.truetype(str(Path(__file__).resolve().parents[1] / 'assets/fonts/DejaVuSans.ttf'),13)
def sheet(shots,file,cols=6,w=180):
 h=round(w*1920/1080);rows=math.ceil(len(shots)/cols);cv=Image.new('RGB',(cols*w,rows*(h+35)+45),'#101e2c');d=ImageDraw.Draw(cv);d.text((12,12),'THE DOOR AT 11:11 — '+('DRAFT ' if draft else '')+'ACTUAL RENDERED FRAMES',font=font,fill='#edd6ae')
 for i,s in enumerate(shots):
  p=source/(s['id']+'.png')
  if not p.exists():continue
  im=Image.open(p).convert('RGB');im.thumbnail((w,h));x=(i%cols)*w;y=45+(i//cols)*(h+35);cv.paste(im,(x,y));d.text((x+5,y+h+3),f"{s['id']}  {s['start']/30:.1f}s  {(s['end']-s['start'])/30:.2f}s",font=font,fill='#edd6ae')
 cv.save(root/file,quality=94)
if draft:
 for i,(a,b) in enumerate([(1,12),(13,27),(28,44),(45,60)],1):sheet([s for s in plan['shots'] if a<=s['number']<=b],f'draft-act-{i}.jpg',4,180)
else:
 sheet(plan['shots'],'The_Door_At_1111_Polish_Storyboard.jpg',8,180)
 picks=['01A','01B','03','20','26','39B','46','50B','53','55','57A','57C','57D','58C','60A','60B','60C'];sheet([s for s in plan['shots'] if s['id'] in picks],'The_Door_At_1111_Polish_Keyframes.jpg',4,270)
print('Rendered-frame sheets saved.')
