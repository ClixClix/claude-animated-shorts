"""From studio/: python src/v2/animation/evidence.py gate-a|gate-b|final.
All boards use rendered frames or frames decoded from the actual MP4s.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import json,subprocess,sys
OUT=Path('out/v2-animation-test');FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=lambda n:ImageFont.truetype(FONT,n)
def board(files,labels,name,title,cols=4,tile=(270,480),crop=None):
    rows=(len(files)+cols-1)//cols;w,h=tile;gap=18;top=76;cell_h=h+38
    im=Image.new('RGB',(cols*(w+gap)+gap,top+rows*cell_h+gap),'#152a31');d=ImageDraw.Draw(im)
    d.text((18,18),title,font=font(23),fill='#f6ddbb')
    for i,(p,label) in enumerate(zip(files,labels)):
        with Image.open(p) as pic:
            pic=pic.convert('RGB')
            if crop:pic=pic.crop(crop)
            pic=ImageOps.contain(pic,(w,h),Image.Resampling.LANCZOS)
            x=gap+(i%cols)*(w+gap);y=top+(i//cols)*cell_h;im.paste(pic,(x+(w-pic.width)//2,y))
            d.text((x,y+h+7),label,font=font(15),fill='#d3d5cd')
    im.save(OUT/name,quality=94,subsampling=0)
def decode(video,folder):
    folder.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),str(folder/'%03d.png')],check=True)
    return sorted(folder.glob('*.png'))
mode=sys.argv[1]
if mode=='gate-a':
    f=[27,79,143,230];board([OUT/'gate-a'/f'frame-{i:03}.png' for i in f],[f'{i:03} / {s}' for i,s in zip(f,['THE LITTLE STRANGER','ESSIE NOTICES','A GENTLE OFFER','A LITTLE LIGHT'])],'ANIMATION_STORYBOARD.jpg','IN THIS TOWN — A LITTLE LIGHT / Animation storyboard',tile=(432,768))
elif mode=='gate-b':
    for name in ['first-step','head-turn','arrival','contact-slide-release','emotional-change']:
        if not (OUT/'gate-b'/f'{name}.json').exists():continue
        meta=json.loads((OUT/'gate-b'/f'{name}.json').read_text());files=decode(OUT/'gate-b'/f'{name}.mp4',OUT/'gate-b'/name)
        assert len(files)==meta['end']-meta['start']+1
        # Every rendered frame appears, including consecutive contact/release frames.
        board(files,[f'Frame {meta["start"]+i:03}' for i in range(len(files))],f'gate-b/{name}-all-frames.jpg',f'GATE B / {name} — every consecutive frame',cols=6,tile=(180,320))
        print(name,len(files),'decoded frames')
elif mode=='final':
    files=decode(OUT/'InThisTown_V2_8Second_Test.mp4',OUT/'decoded-final')
    assert len(files)==240
    picks=[27,79,143,230];board([files[i] for i in picks],[f'{i:03} / {s}' for i,s in zip(picks,['THE LITTLE STRANGER','ESSIE NOTICES','A GENTLE OFFER','A LITTLE LIGHT'])],'ANIMATION_STORYBOARD.jpg','IN THIS TOWN — A LITTLE LIGHT / Actual final video frames',tile=(432,768))
    contact=[117,121,125,126,127,128,129,130,132,135,138,141,144,147,149,151,153,154,155,157,159,161,164,165]
    board([files[i] for i in contact],[f'Frame {i:03}' for i in contact],'CONTACT_INTERACTION_FRAMES.jpg','THE WARM DRINK / Reach → contact → push → release',cols=6,tile=(320,360),crop=(90,650,1060,1420))
    acting=[49,55,61,65,71,79,174,180,186,192,198,204,210,216,222,230,236,239]
    board([files[i] for i in acting],[f'Frame {i:03}' for i in acting],'EMOTIONAL_ACTING_FRAMES.jpg','A LITTLE LIGHT / Notice → concern → relief → reassurance',cols=6,tile=(270,480))
    board(files,[f'{i:03}' for i in range(240)],'ALL_240_FRAMES.jpg','Complete native-resolution video decode / all 240 frames',cols=15,tile=(108,192))
    print('All 240 frames decoded; final storyboard, contact and emotional evidence boards written.')
