import './lib/runtime.mjs';
// Offline editorial preparation from the single approved, cached Adam take. No provider client.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
const out=path.resolve('out/v2-episodes/door-at-1111-polish');await fs.mkdir(out,{recursive:true});
for(const file of ['PRESERVATION_BASELINE.json','PAID_GENERATION_JOURNAL.json'])await fs.copyFile(path.resolve('out/v2-episodes/door-at-1111',file),path.join(out,file));
const meta=JSON.parse(await fs.readFile('out/v2-narration/Door_At_1111_Adam-timestamps.json','utf8'));
const input='out/v2-narration/Door_At_1111_Adam.mp3';
const hash=b=>createHash('sha256').update(b).digest('hex');
if(meta.narrator.voiceId!=='pNInz6obpgDQGcFmaJgB'||meta.processing?.playback.speed!==1.35||meta.processing.playback.mode!=='varispeed'||hash(await fs.readFile(input))!==meta.audioHash)throw Error('Wrong or modified narration.');
const board=JSON.parse(await fs.readFile('src/v2/episodes/door-at-1111-polish/storyboard.json','utf8'));
const units=[];
meta.timing.sentences.forEach((s,i)=>{
 if(i!==12){units.push({id:String(i),...s});return;}
 const w=meta.timing.words.filter(w=>w.start>=s.start-.001&&w.end<=s.end+.001);
 const stop=w.find(w=>w.text==='stop'),puddle=w.find(w=>w.text==='puddle');
 if(!stop||!puddle)throw Error('Missing running clause timing.');
 const after=t=>w.find(w=>w.start>t+.001).start;
 units.push({id:'12a',start:s.start,end:stop.end,text:'He splashed past the empty bus stop,'},{id:'12b',start:after(stop.end),end:puddle.end,text:'slipped around a puddle,'},{id:'12c',start:after(puddle.end),end:s.end,text:'and reached his porch just as the last light went dark.'});
});
const group=(shots,ids=[])=>({shots,ids:ids.map(String)});
const groups=[group([1,2,3,4],[0]),group([5],[1,2]),group([6],[3]),group([7,8,9]),group([10],[4]),group([11],[5]),group([12],[6]),
 group([13,14],[7]),group([15],[8]),group([16],[9]),group([17],[10]),group([18]),group([20],[11]),group([21],['12a']),group([22],['12b']),group([23,24],['12c']),group([25]),group([26],[13,14,15]),group([27],[16]),
 group([28,29],[17,18]),group([30],[19]),group([31],[20]),group([32],[21]),group([34],[22,23]),group([36],[24,25]),group([37],[26]),group([38],[27,28]),group([39],[29,30]),group([40],[31]),group([41],[32,33]),group([42],[34,35]),group([43,44],[36]),
 group([45],[37]),group([46],[38]),group([47],[39]),group([48],[40]),group([49],[41]),group([50,51],[42]),group([52,53],[43]),group([54],[44]),group([55,56],[45]),group([57],[46,47]),group([58],[48]),group([59],[49,50]),group([60],[51,52,53])];
const editorialFrames=s=>Math.round((board[s.number-1].end-board[s.number-1].start)*([2,3,5,7,8,9,11,13,15,16,17,23,29,30,31,33,34,35,37,39,40,41,48,49,57,58].includes(s.number)?.70:.90));
let frame=0,previousSource=0,previousTarget=0;const shots=[],placements=[],pauses=[];
for(const g of groups){
 if(!g.ids.length)continue; // Redundant unvoiced inserts never delay the narration.
 const extended={20:18,26:25,34:33,36:35};
 const entries=g.shots.map(n=>({...board[n-1],start:n===3?102:n===4?120:board[(extended[n]??n)-1].start,end:n===3?120:n===4?195:board[n-1].end})),baseDuration=entries.reduce((n,s)=>n+editorialFrames(s),0);
 let from=0,to=0;
 if(g.ids.length){
  const first=units.findIndex(u=>u.id===g.ids[0]),last=units.findIndex(u=>u.id===g.ids.at(-1));
  if(first<0||last<first||units.slice(first,last+1).map(u=>u.id).join()!==g.ids.join())throw Error('Non-contiguous narration group.');
  from=first===0?0:(units[first-1].end+units[first].start)/2;
  to=last===units.length-1?meta.duration:(units[last].end+units[last+1].start)/2;
  if(Math.abs(from-previousSource)>1e-6)throw Error('Narration source gap or repeat.');
 }
 const start=frame,length=Math.round(to*30)-start;
 // Keep every sample of the approved take continuous; visuals fit its existing pauses.
 placements.push({ids:g.ids,sourceStart:from,sourceEnd:to,targetStart:from,targetEnd:to});
 previousSource=to;previousTarget=to;
 entries.forEach((s,j)=>{
  const end=j===entries.length-1?start+length:start+Math.round(length*entries.slice(0,j+1).reduce((n,x)=>n+editorialFrames(x),0)/baseDuration);
  const pieces=s.number===58?4:s.number===11?3:s.number===59?3:[38,39,50,57,60].includes(s.number)?2:Math.ceil((end-frame)/120),originalStart=frame;
  for(let k=0;k<pieces;k++){
   const cuts=Array.from({length:pieces+1},(_,i)=>originalStart+Math.round((end-originalStart)*i/pieces));
   const placement=placements.at(-1);
   const atWord=(text,from)=>{const w=meta.timing.words.find(w=>w.text===text&&w.start>=from);if(!w)throw Error('Missing editorial word '+text);return Math.round((placement.targetStart+w.start-placement.sourceStart)*30);};
   if(s.number===50)cuts[1]=atWord('there',79.9);
   if(s.number===57)cuts[1]=atWord('It',92.3);
   if(s.number===58){cuts[1]=atWord('at',97.9);cuts[2]=atWord('just',98.8);cuts[3]=atWord('in',100.4);}
   if(s.number===59){cuts[1]=atWord('He',103.7);cuts[2]=atWord('anyone',104.7);}
   const a=cuts[k],b=cuts[k+1];
   const sourceStart=s.start+(s.end-s.start)*k/pieces,sourceEnd=s.start+(s.end-s.start)*(k+1)/pieces;
   shots.push({id:`${String(s.number).padStart(2,'0')}${pieces>1?String.fromCharCode(65+k):''}`,number:s.number,variant:k,start:a,end:b,sourceStart,sourceEnd,direction:s.direction,purpose:pieces>1?`${s.direction} — purposeful detail ${k+1}/${pieces}`:s.direction,flashback:s.number===58});
  }
  frame=end;
 });
}
if(previousSource!==meta.duration)throw Error('Incomplete recording.');
// At most one frame of final padding; never insert a gap between lines.
frame=Math.ceil(meta.duration*30);shots.at(-1).end=frame;
const tail=frame/30-previousTarget;if(tail<0)throw Error('Narration truncation.');if(tail>0)pauses.push({at:meta.duration,seconds:tail});
for(let i=0;i<shots.length;i++)if(shots[i].end-shots[i].start>120||shots[i].start!==(i?shots[i-1].end:0))throw Error('Invalid edit.');
if(frame>5400||frame<2700)throw Error('Episode duration outside approved range.');
await build({entryPoints:['src/v2/narration/server/audio.ts'],outfile:path.join(out,'audio-tools.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
const audio=await import(pathToFileURL(path.join(out,'audio-tools.mjs')).href);
// Preserve the continuous take sample-for-sample, with less than one frame of final padding.
const parts=[],labels=[];let cursor=0,serial=0;
for(const p of pauses){
 if(p.at<cursor||p.at>meta.duration||p.seconds<=0||p.seconds>20)throw Error('Invalid editorial silence.');
 if(p.at>cursor){const id=`v${serial++}`;parts.push(`[0:a]atrim=start=${cursor}:end=${p.at},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=mono[${id}]`);labels.push(`[${id}]`);}
 const id=`p${serial++}`;parts.push(`anullsrc=r=48000:cl=mono,atrim=duration=${p.seconds}[${id}]`);labels.push(`[${id}]`);cursor=p.at;
}
if(cursor<meta.duration){const id=`v${serial++}`;parts.push(`[0:a]atrim=start=${cursor},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=mono[${id}]`);labels.push(`[${id}]`);}
parts.push(`${labels.join('')}concat=n=${labels.length}:v=0:a=1,apad=whole_dur=${frame/30},atrim=end=${frame/30}[out]`);
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',input,'-filter_complex',parts.join(';'),'-map','[out]','-c:a','pcm_f32le',path.join(out,'Narration_Stem.wav')]);
const unitTimes=Object.fromEntries(placements.flatMap(p=>p.ids.map(id=>{const u=units.find(u=>u.id===id);return [id,{start:p.targetStart+u.start-p.sourceStart,end:p.targetStart+u.end-p.sourceStart}];})));
const sourceToActual=seconds=>{const b=seconds*30,s=shots.find(s=>b>=s.sourceStart&&b<s.sourceEnd)??shots.at(-1);return s.start+(s.end-s.start)*(b-s.sourceStart)/(s.sourceEnd-s.sourceStart);};
const cues={taps:[...[22,23,24].map(id=>Math.round(unitTimes[String(id)].start*30)),...[99.8,103.8,104.8].map(t=>Math.round(sourceToActual(t)))]};
const manifest={cues,title:'The Door at 11:11',width:1080,height:1920,fps:30,durationInFrames:frame,shotLimit:120,shots,narration:{source:input,hash:meta.audioHash,voiceId:meta.narrator.voiceId,playback:meta.processing.playback,sourceDuration:meta.duration,unitTimes,placements,pauses,timingBasis:'Continuous cached recording at approved 1.35x processing; no editorial pauses between narration lines.'}};
await fs.copyFile(input,path.join(out,'Polish_Narration_Flow.mp3')); // Exact cached bytes for listening review.
await fs.writeFile(path.join(out,'The_Door_At_1111_Polish_Shot_Manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(out,'render-props.json'),JSON.stringify({shots,cues},null,2)+'\n');
// Editorial cut data only; no provider/account metadata or audio is copied into source.
await fs.writeFile('src/v2/episodes/door-at-1111-polish/edit.json',JSON.stringify({shots,cues},null,2)+'\n');
await fs.writeFile(path.join(out,'The_Door_At_1111_Polish_Shot_Manifest.csv'),'id,start_frame,end_frame_exclusive,duration_seconds,source_shot,direction\n'+shots.map(s=>`${s.id},${s.start},${s.end},${((s.end-s.start)/30).toFixed(3)},${s.number},"${s.direction.replaceAll('"','""')}"`).join('\n')+'\n');
console.log(JSON.stringify({frames:frame,seconds:frame/30,shots:shots.length,narration:await audio.inspectAudio(path.join(out,'Narration_Stem.wav')),maxShotFrames:Math.max(...shots.map(s=>s.end-s.start))}));

// Caption times follow the actual complete cached narration placements, without ASR/API calls.
const words=meta.timing.words.map(w=>{const p=placements.find(p=>w.start>=p.sourceStart-.001&&w.end<=p.sourceEnd+.001);if(!p)throw Error('Caption word outside complete narration coverage: '+w.text);return {text:w.text,start:Math.floor((p.targetStart+w.start-p.sourceStart)*30),end:Math.ceil((p.targetStart+w.end-p.sourceStart)*30)};});
const captions=words.map((w,i)=>({start:w.start,end:Math.max(w.start+1,Math.min(w.end+2,words[i+1]?.start??frame)),text:w.text}));
if(captions.some((c,i)=>c.text.trim().split(/\s+/).length!==1||c.end>(captions[i+1]?.start??frame)))throw Error('One-word caption overlap.');
await fs.writeFile('src/v2/episodes/door-at-1111-polish/captions.json',JSON.stringify(captions,null,2)+'\n');
console.log(JSON.stringify({polishedSeconds:frame/30,captionWords:words.length,captionCards:captions.length,narrationRegenerated:false}));

const srtTime=f=>{const ms=Math.round(f*1000/30),hours=Math.floor(ms/3600000),minutes=Math.floor(ms/60000)%60,seconds=Math.floor(ms/1000)%60;return [hours,minutes,seconds].map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
await fs.writeFile(path.join(out,'The_Door_At_1111_Polish_Subtitles.srt'),captions.map((c,i)=>`${i+1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n'),'utf8');
if(shots.some(s=>s.end-s.start<12))throw Error('An insert is too short to read.');
if(pauses.some(p=>p.at<meta.duration)||pauses.reduce((n,p)=>n+p.seconds,0)>1/30)throw Error('Editorial silence interrupts narration.');
if(captions.map(c=>c.text).join(' ')!==meta.timing.words.map(w=>w.text).join(' '))throw Error('Subtitle text is incomplete.');
