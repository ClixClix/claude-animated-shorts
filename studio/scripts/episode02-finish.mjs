import './lib/runtime.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const out=path.resolve('out/v2-episodes/in-this-town-02');
const manifest=JSON.parse(await fs.readFile(path.join(out,'EP02_SHOT_MANIFEST.json'),'utf8'));
const readiness=JSON.parse(await fs.readFile(path.join(out,'PRODUCTION_READINESS.json'),'utf8'));
const duration=manifest.durationInFrames/30;
const ff=(args)=>execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error',...args],{maxBuffer:8*1024*1024});
const voice=path.join(out,'Narration_Stem.wav'),sfx=path.join(out,'SFX_Stem.wav');
const music=path.join(out,'Music_Stem.wav');
const musicProof=path.join(out,'EP02_SERIES_MUSIC_SOURCE.json');
const inputFile=process.argv.includes('--preview')?'EP02_540p_Visual.mp4':'EP02_1080p_Visual.mp4';
const visual=path.join(out,inputFile);
const exists=async file=>fs.access(file).then(()=>true,()=>false);
for(const file of [voice,sfx,music,musicProof,visual])if(!await exists(file))throw Error('EP02_REQUIRED_ASSET_MISSING: '+file);
if(process.argv.includes('--licensed-music'))throw Error('EP02_MUSIC_LOCK: Use V2_MUSIC_FILE to supply the approved Episode 01 soundtrack; arbitrary overrides are disabled.');
const musicSource=JSON.parse(await fs.readFile(musicProof,'utf8'));
if(musicSource.stage!=='EP01_SERIES_MUSIC_REUSED'||musicSource.sourceTitle!=='Numbers — Instrumental Intro Loop')
 throw Error('EP02_MUSIC_LOCK: a non-series soundtrack was supplied.');
const scratch=!readiness.voiceProvided;
const preview=process.argv.includes('--preview');
function mix(label,includeMusic){
 const wav=path.join(out,(scratch?'SCRATCH':'MASTER')+'_'+label+'.wav');
 let inputs=['-i',voice,'-i',sfx];
 let filter="[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,highpass=f=65,volume=1.0[n];"+
            "[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.82[s];";
 if(includeMusic){
  inputs.push('-i',music);
  filter+="[2:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=1.0[m];"+
    "[m][n]sidechaincompress=threshold=0.025:ratio=4:attack=45:release=400[duck];"+
    "[n][s][duck]amix=inputs=3:normalize=0,";
 }else filter+="[n][s]amix=inputs=2:normalize=0,";
 filter+=`apad=whole_dur=${duration},atrim=end=${duration},`+
    "acompressor=threshold=0.22:ratio=1.5:attack=18:release=140,"+
    "loudnorm=I=-16:TP=-1.8:LRA=10,alimiter=limit=0.80:attack=5:release=70[a]";
 ff(['-y',...inputs,'-filter_complex',filter,'-map','[a]',
  '-ar','48000','-ac','2','-c:a','pcm_f32le','-t',String(duration),wav]);
 const basename=(scratch?'EP02_SCRATCH':'EP02_Final')+(includeMusic?'_With_Music':'_No_Music')+(preview?'_540p':'')+'.mp4';
 const output=path.join(out,basename);
 ff(['-y','-i',visual,'-i',wav,'-map','0:v:0','-map','1:a:0',
   '-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2',
   '-t',String(duration),'-movflags','+faststart','-metadata',
   `comment=Episode 02 ${scratch?'SILENT SCRATCH NOT FOR PUBLICATION':'user supplied narration'}`,output]);
 return {file:output,wav,scratch,includesMusic:includeMusic,musicSource:includeMusic?music:null};
}
const noMusic=mix('No_Music',false);
const withMusic=mix('With_Music',true);
const report={
 stage:'DELIVERABLES_CREATED_AWAITING_BATCH_QA',
 voiceApprovedForEpisode:readiness.voiceProvided,
 providedWordTimings:readiness.captionAlignment==='ADAM_EXACT_WORD_TIMINGS',
 musicLicensedOverride:false,
 sourceMusic:musicSource.sourceTitle+' — '+musicSource.artist+' (Episode 01 source, original intro loop)',
 sourceMusicSHA256:musicSource.sourceSHA256,
 musicRightsConfirmedForPublication:false,
 framesExpected:manifest.durationInFrames,duration,
 outputs:[noMusic,withMusic],paidNarrationRequests:0,publishingAllowed:false,
 note:scratch?'Silent narration draft; cannot be public final.':'Final candidate only; not verified until batch full-video QA and user creative/right review.'
};
await fs.writeFile(path.join(out,'EP02_FINISHING_STATUS.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
