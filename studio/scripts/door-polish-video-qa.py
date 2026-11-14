"""Decode every final frame and verify actual delivery containers, rather than render intentions."""
from pathlib import Path
import json,subprocess,hashlib
import numpy as np

root=Path('out/v2-episodes/door-at-1111-polish')
manifest=json.loads((root/'The_Door_At_1111_Polish_Shot_Manifest.json').read_text())
report={'expectedFrames':manifest['durationInFrames'],'expectedSeconds':manifest['durationInFrames']/30,'containers':{}}
for label in ['No_Music','With_Music']:
    file=root/f'The_Door_At_1111_Polish_Final_{label}.mp4'
    data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
    v=next(s for s in data['streams'] if s['codec_type']=='video');a=next(s for s in data['streams'] if s['codec_type']=='audio')
    assert (v['width'],v['height'],v['r_frame_rate'],v['codec_name'])==(1080,1920,'30/1','h264')
    assert int(v['nb_frames'])==manifest['durationInFrames'] and abs(float(data['format']['duration'])-report['expectedSeconds'])<.05
    assert a['codec_name']=='aac' and int(a['sample_rate'])==48000 and a['channels']==2
    subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(file),'-map','0:v:0','-map','0:a:0','-f','null','-'],check=True)
    # The two audio mixes must preserve identical video packets.
    video_hash=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-map','0:v:0','-c:v','copy','-f','hash','-hash','sha256','-']).decode().strip()
    report['containers'][label]={'file':str(file),'bytes':file.stat().st_size,'video':{k:v[k] for k in ['width','height','r_frame_rate','nb_frames','codec_name','pix_fmt']},'audio':{k:a[k] for k in ['codec_name','sample_rate','channels','duration']},'duration':float(data['format']['duration']),'videoPacketHash':video_hash,'fullDecodePassed':True,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
assert len({c['videoPacketHash'] for c in report['containers'].values()})==1

file=root/'The_Door_At_1111_Polish_Final_No_Music.mp4'
p=subprocess.Popen(['ffmpeg','-nostdin','-v','error','-i',str(file),'-an','-vf','scale=96:170','-pix_fmt','gray','-f','rawvideo','pipe:1'],stdout=subprocess.PIPE)
count=0;black=[];rows=[];shot_index=0;previous=None;hashes=set();changes=[];means=[]
while True:
    raw=p.stdout.read(96*170)
    if not raw:break
    assert len(raw)==96*170,'Incomplete decoded frame'
    image=np.frombuffer(raw,dtype=np.uint8).reshape((170,96));mean=float(image.mean());means.append((mean,count))
    if float((image<5).mean())>.98:black.append(count)
    hashes.add(hashlib.sha256(raw).hexdigest())
    if previous is not None:changes.append(float(np.abs(image.astype(np.int16)-previous).mean()))
    previous=image.astype(np.int16);count+=1
    shot=manifest['shots'][shot_index]
    if count==shot['end']:
        rows.append({'shot':shot['id'],'frames':shot['end']-shot['start'],'distinctReducedFrames':len(hashes),'meanInterFrameDifference':float(np.mean(changes)) if changes else 0,'maximumInterFrameDifference':max(changes,default=0)})
        hashes=set();changes=[];previous=None;shot_index+=1
assert p.wait()==0 and count==manifest['durationInFrames']
assert not black,f'Unexpected black frames: {black}'
report.update({'decodedFrames':count,'blackFrames':black,'darkestFrames':[{'frame':f,'meanLuma':m} for m,f in sorted(means)[:12]],'shots':rows,'note':'Static clock, light-counting and empty-pavement holds are intentional inserts. Frame differences identify review candidates; they do not prove acting or contact quality.'})
(root/'FINAL_VIDEO_QA.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'decodedFrames':count,'blackFrames':len(black),'sameVideoAcrossMixes':True,'duration':report['expectedSeconds']}))
