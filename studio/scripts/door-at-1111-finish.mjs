// Reusable post-render finishing: revise audio without rendering any animation again.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const out=path.resolve('out/v2-episodes/door-at-1111'),manifest=JSON.parse(await fs.readFile(path.join(out,'The_Door_At_1111_Shot_Manifest.json'),'utf8')),duration=manifest.durationInFrames/30;
for(const [name,source] of [['audio','src/v2/narration/server/audio.ts'],['music','src/v2/narration/server/music.ts']])await build({entryPoints:[source],outfile:path.join(out,name+'-finishing.mjs'),bundle:true,platform:'node',format:'esm',target:'node24'});
const audio=await import(pathToFileURL(path.join(out,'audio-finishing.mjs')).href),{SERIES_MUSIC}=await import(pathToFileURL(path.join(out,'music-finishing.mjs')).href),preset=SERIES_MUSIC.in_this_town;
const ff=args=>execFileSync('ffmpeg',['-nostdin','-hide_banner','-v','error',...args],{maxBuffer:8*1024*1024});
const narration=path.join(out,'Narration_Stem.wav'),sfx=path.join(out,'SFX_Stem.wav'),music=path.join(out,'Music_Stem.wav');
const report={duration,series:'in_this_town',music:{...preset},providerRequests:0};
let musicAvailable=true;try{await fs.access(preset.privateFile);}catch{musicAvailable=false;report.missingMusic=preset.privateFile;}
if(musicAvailable){
 report.music.sourceSHA256=createHash('sha256').update(await fs.readFile(preset.privateFile)).digest('hex');report.music.source=await audio.inspectAudio(preset.privateFile);
 if(report.music.source.duration<duration)throw Error('Supplied recording is too short; looping is not silently enabled.');
 const filters=`[0:a]atrim=end=${duration},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=${preset.gainDB}dB,afade=t=in:d=0.05,afade=t=out:st=${duration-preset.fadeOutSeconds}:d=${preset.fadeOutSeconds}[m];[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur=${duration},atrim=end=${duration}[key];[m][key]sidechaincompress=threshold=0.03:ratio=3:attack=50:release=450:makeup=1[out]`;
 ff(['-y','-i',preset.privateFile,'-i',narration,'-filter_complex',filters,'-map','[out]','-c:a','pcm_f32le',music]);
 report.music.processing='Original tempo/pitch, no loop; -10 dB starting gain, gentle 3:1 narration-priority ducking, four-second ending fade.';
}
async function mix(name,withMusic){
 const raw=path.join(out,name+'-float.wav'),master=path.join(out,name+'.wav');
 await audio.mixTracks({narration,sfx:{file:sfx,duck:false},...(withMusic?{music:{file:music,duck:false}}:{})},raw);
 const before=await audio.measureLoudness(raw),gain=Math.min(-16-before.integratedLUFS,-1.8-before.truePeakDBTP);
 ff(['-y','-i',raw,'-af',`volume=${gain}dB,apad=whole_dur=${duration},atrim=end=${duration}`,'-ar','48000','-ac','2','-c:a','pcm_f32le',master]);
 const after=await audio.measureLoudness(master);if(after.truePeakDBTP> -1)throw Error('Mix peak failure.');return {file:master,before,after,gainDB:gain};
}
report.noMusic=await mix('Master_No_Music',false);if(musicAvailable)report.withMusic=await mix('Master_With_Music',true);
report.stems={narration:await audio.measureLoudness(narration),sfx:await audio.measureLoudness(sfx),...(musicAvailable?{music:await audio.measureLoudness(music)}:{})};
if(!process.argv.includes('--stems-only')){
 const visual=path.join(out,'The_Door_At_1111_Visual_Master.mp4');await fs.access(visual);
 for(const [label,master] of [['No_Music',report.noMusic],...(report.withMusic?[['With_Music',report.withMusic]]:[])]){
  const final=path.join(out,`The_Door_At_1111_Final_${label}.mp4`);ff(['-y','-i',visual,'-i',master.file,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(duration),'-movflags','+faststart',final]);
  let encoded=await audio.measureLoudness(final);if(encoded.truePeakDBTP> -1){const safe=final+'.safe.mp4';await audio.finalizeVideoAudio(final,safe);await fs.rename(safe,final);encoded=await audio.measureLoudness(final);}
  if(encoded.truePeakDBTP> -1)throw Error('Encoded AAC peak failure.');report[label]={file:final,encoded,videoStreamCopied:true};
 }
}
await fs.writeFile(path.join(out,'AUDIO_FINISHING_QA.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
