/**
 * Verify the ACTUAL 60-shot/3876-frame Episode 02 cloud preview.
 * Extract 20%, 50% and 80% samples for EVERY shot, plus an HTML board.
 * No audio generation, publication, or artistic approval is implied.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const out=path.resolve('out/v2-episodes/in-this-town-02');
const movie=path.join(out,'EP02_540p_Visual.mp4');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const review=path.join(out,'full-timeline-review');
await fs.mkdir(review,{recursive:true});
const run=(bin,args,maxBuffer=16*1024*1024)=>{
 const p=spawnSync(bin,args,{encoding:'utf8',maxBuffer});
 if(p.error||p.status!==0)throw Error(bin+' failed: '+String(p.error??p.stderr).slice(-2000));
 return p.stdout;
};
if(manifest.shots.length!==60||manifest.durationInFrames!==3876)
 throw Error('Active box scratch manifest no longer matches 60 shots/3876 frames; re-plan the QA.');
for(let i=0;i<60;i++){
 const s=manifest.shots[i];
 if(s.start!==(i?manifest.shots[i-1].end:0)||s.end<=s.start)
  throw Error('Missing or overlapping edit for shot '+s.id);
}
if(manifest.shots[59].end!==manifest.durationInFrames)throw Error('Timeline incomplete.');
const result=JSON.parse(run('ffprobe',[
 '-v','error','-count_frames','-select_streams','v:0',
 '-show_entries','stream=codec_name,width,height,r_frame_rate,nb_read_frames',
 '-of','json',movie
]));
const stream=result.streams?.[0];
if(!stream||stream.codec_name!=='h264'||stream.width!==540||stream.height!==960||
 stream.r_frame_rate!=='30/1'||Number(stream.nb_read_frames)!==manifest.durationInFrames)
 throw Error('Full movie decode/frame identity failed: '+JSON.stringify(stream));
const selected=[];
for(const shot of manifest.shots){
 for(const percent of [20,50,80]){
  selected.push({shot:shot.id,percent,
   frame:shot.start+Math.floor((shot.end-shot.start-1)*percent/100),
   narrationAnchor:shot.narrationAnchor,cameraAndAction:shot.cameraAndAction});
 }
}
const indices=[...new Set(selected.map(x=>x.frame))].sort((a,b)=>a-b);
if(indices.length!==180)throw Error('Expected 180 independent actual-frame samples; got '+indices.length);
// FFmpeg's expression evaluator fails to initialize a single 180-term
// select filter on some installations (reproduced locally). Decode in nine
// bounded groups of 20 independent frame indices instead. Each run starts
// output numbering at its exact absolute sample ordinal, so the 60-shot
// HTML board still points to the intended original source frames.
const batchSize=20;
for(let start=0;start<indices.length;start+=batchSize){
 const batch=indices.slice(start,start+batchSize);
 const filter='select='+batch.map(n=>'eq(n\\\\,'+n+')').join('+');
 run('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',movie,
  '-vf',filter,'-fps_mode','vfr','-q:v','4',
  '-start_number',String(start+1),
  path.join(review,'sample_%03d.jpg')],32*1024*1024);
 for(let i=0;i<batch.length;i++){
  const sample='sample_'+String(start+i+1).padStart(3,'0')+'.jpg';
  await fs.access(path.join(review,sample));
 }
}
const frameToImage=new Map(indices.map((n,i)=>[n,'sample_'+String(i+1).padStart(3,'0')+'.jpg']));
for(const s of selected){
 s.image=frameToImage.get(s.frame);
 await fs.access(path.join(review,s.image));
}
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=manifest.shots.map(shot=>'<article><h3>Shot '+esc(shot.id)+' — '+esc(shot.act)+'</h3>'+
 '<p>'+esc(shot.narrationAnchor)+'<br>'+esc(shot.cameraAndAction)+'</p>'+
 '<div class="trip">'+selected.filter(x=>x.shot===shot.id).map(s=>
 '<figure><img loading="lazy" src="'+s.image+'"><figcaption>'+s.percent+'% · frame '+s.frame+'</figcaption></figure>').join('')+
 '</div><small>Creative QA: NOT YET APPROVED</small></article>').join('\n');
const html='<!doctype html><html><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Episode 02 — 60-shot actual frame review</title>'+
 '<style>body{background:#14202b;color:#f2f2ec;font-family:system-ui;margin:18px auto;max-width:1420px;padding:12px}'+
 'article{border:1px solid #53606d;border-radius:12px;background:#23303b;padding:12px;margin:16px 0}'+
 '.trip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}figure{margin:0}img{width:100%;height:auto;border-radius:6px}'+
 'figcaption,small{color:#d8c2ae;font-size:12px}p{font-size:14px}</style></head><body>'+
 '<h1>Episode 02 — complete 60-shot visual QA</h1><p>Actual 540×960 H.264 frames from the stitched 2:09.2 scratch movie. '+
 'Not audio approved, not release-ready, and no claim of visual parity with Episode 01.</p>'+
 '<p><a href="../EP02_540p_Visual.mp4">Play full 60-shot movie</a></p>'+
 cards+'</body></html>';
await fs.writeFile(path.join(review,'ALL_60_SHOTS.html'),html);
const bytes=await fs.readFile(movie);
const report={
 stage:'FULL_60_SHOT_CLOUD_RENDER_DECODED_NOT_ARTISTICALLY_APPROVED',
 movieSha256:createHash('sha256').update(bytes).digest('hex'),
 sourceSignature:manifest.sourceSignature,
 shots:60,frames:Number(stream.nb_read_frames),
 width:stream.width,height:stream.height,fps:30,seconds:3876/30,
 samples:180,html:'full-timeline-review/ALL_60_SHOTS.html',
 sceneMovingPreview:true,voiceIncluded:false,soundMixIncluded:false,
 userVisualReviewPending:true,episode1VisualParityVerified:false,
 noPublishing:true,noPaidMediaCalls:true,
 note:'Frame-level technical decode pass is NOT a creative review. Check all 60 moving shots, camera cuts, box/cat ratios, overhead scale and character acting.'
};
await fs.writeFile(path.join(review,'FULL_60_SHOT_QA.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
