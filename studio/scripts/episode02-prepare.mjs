import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';

const out=path.resolve('out/v2-episodes/in-this-town-02');
const source=path.resolve('src/v2/episodes/in-this-town-02');
await fs.mkdir(out,{recursive:true});
const draft=JSON.parse(await fs.readFile(path.join(source,'EDITORIAL_SCRATCH_PLAN.json'),'utf8'));
const narrationText=(await fs.readFile(path.join(source,'DRAFT_BOX_NARRATION.txt'),'utf8')).trim();
const wantedPath=(flag)=>{const i=process.argv.indexOf(flag);return i>=0?process.argv[i+1]:undefined;};
let file=wantedPath('--voice')??process.env.EP02_VOICE_FILE??path.join(out,'Approved_Narration.wav');
const voiceExists=await fs.access(file).then(()=>true,()=>false);
const scratch=process.argv.includes('--allow-scratch');
if(!voiceExists&&!scratch)throw new Error('Missing approved Episode 02 narration. Pass --voice C:\\path\\Approved_Narration.wav, or explicitly --allow-scratch to make a SILENT draft. No paid ElevenLabs request is made.');
if(!voiceExists){file=path.join(out,'SCRATCH_SILENCE.wav');execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',String(draft.approximateSeconds),'-c:a','pcm_s16le',file]);}
const ffprobe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file],{encoding:'utf8'}));
const voiceSeconds=Number(ffprobe(file).format.duration);
if(!Number.isFinite(voiceSeconds)||voiceSeconds<=0)throw Error('Voice duration invalid.');
// Aim for tail room while fitting the genuine, externally supplied spoken take.
// A silent scratch intentionally retains the original approved 129.2-second editorial plan.
const total=voiceExists?Math.ceil((voiceSeconds+2)*30):draft.approximateFrameCount;
const ratio=total/draft.approximateFrameCount;
let cursor=0;
const shots=draft.shots.map((s,i)=>{
 const end=i===draft.shots.length-1?total:Math.round(s.estimateEndFrame*ratio);
 const item={id:s.id,sequence:s.sequence,act:s.act,start:cursor,end,
  narrationAnchor:s.narrationAnchor,cameraAndAction:s.cameraAndAction,soundCue:s.soundCue};
 if(end<=cursor||end-cursor>120)throw new Error('Invalid shot '+s.id+' after duration change; production edit needs review of shot splitting before rendering.');
 cursor=end;return item;
});
const duration=cursor/30;
const words=(narrationText.match(/[^\s]+/g)||[]).flatMap(item=>{
 const clean=item.replace(/^['"“”]+|['"“”,.!?:;]+$/g,'');
 return clean?[clean]:[];
});
// Optional word-level alignment file from authorized narration, preferred over estimated captions.
// Expected: array of {text,start,end}, timings in seconds from the FINAL processed voice take.
let alignment=null;
const alignPath=wantedPath('--words')??path.join(out,'Approved_Word_Timings.json');
try{alignment=JSON.parse(await fs.readFile(alignPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let captions=[];
if(alignment){
 if(!Array.isArray(alignment)||alignment.length<words.length*.75)throw new Error('Word alignment file is incomplete.');
 captions=alignment.map(x=>({start:Math.round(Number(x.start)*30),end:Math.round(Number(x.end)*30),text:String(x.text).trim()})).filter(c=>c.text&&c.end>c.start);
}else{
 // Scratch time guides only: a real performance can pause or speak unevenly.
 // Never claim these estimates are synchronized to actual spoken consonants.
 const sum=words.reduce((n,w)=>n+Math.max(1,w.length)**.58,0);
 let current=0;
 captions=words.map(w=>{
  const weight=Math.max(1,w.length)**.58;
  const start=Math.round(current/sum*(voiceSeconds*30));
  current+=weight;
  const end=Math.round(current/sum*(voiceSeconds*30));
  return {start,end:Math.max(start+1,end),text:w};
 });
}
const props={shots,captions,previewScale:1,optimize:true,audioApproved:voiceExists};
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const signature=hash([narrationText,JSON.stringify(props)].join('\n'));
await fs.writeFile(path.join(out,'render-props.json'),JSON.stringify(props,null,2)+'\n');
await fs.writeFile(path.join(out,'EP02_SHOT_MANIFEST.json'),JSON.stringify({episode:'The Cat Who Became a Box',shots,durationInFrames:cursor,width:1080,height:1920,fps:30,sourceSignature:signature},null,2)+'\n');
const stem=path.join(out,'Narration_Stem.wav');
execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error','-y','-i',file,
  '-af',`aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=${duration},atrim=end=${duration}`,
  '-ar','48000','-ac','2','-c:a','pcm_f32le',stem]);
await fs.writeFile(path.join(out,'PRODUCTION_READINESS.json'),JSON.stringify({
 stage:'PREPARED_NOT_CHECKED',sourceSignature:signature,durationInFrames:cursor,durationSeconds:duration,
 shots:shots.length,voiceInput:file,voiceProvided:voiceExists,
 captionAlignment:alignment?'provided_exact_timings':'ESTIMATED_NOT_VERIFIED',
 publishingAllowed:false,paidGenerationRequests:0,
 note:voiceExists?'Narration supplied locally by user. Rights, voice match and sync not reviewed.':'Silent SCRATCH only. Must supply approved narration before release.'
},null,2)+'\n');
console.log(JSON.stringify({stage:'prepared',frames:cursor,shots:shots.length,duration,voiceProvided:voiceExists,words:words.length,alignment:!!alignment,paidRequests:0}));
