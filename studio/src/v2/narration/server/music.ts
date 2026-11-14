/** Private user-supplied recording. Never copied into public/ or committed. */
export const SERIES_MUSIC={
 in_this_town:{title:'Numbers — Instrumental Intro Loop',artist:'TEMPOREX',privateFile:'/workspace/v2-private-audio/temporex-numbers-intro.mp3',gainDB:-10,fadeOutSeconds:4,tempo:1,pitchSemitones:0,reviewOnly:true,cleanLoop:{startSeconds:0,periodSeconds:10.228662,crossfadeSeconds:0.06,reason:'User requested opening music only, excluding the later whistle passage, looped as needed.'}},
 what_if_cats:null,
} as const;

/** Repeat a source phrase at its original tempo/pitch, overlapping only the seam. */
export function musicSourceFilter(loop:{startSeconds:number;periodSeconds:number;crossfadeSeconds:number},duration:number,sampleRate=48000){
 const {startSeconds,periodSeconds,crossfadeSeconds}=loop;
 if(![startSeconds,periodSeconds,crossfadeSeconds,duration].every(Number.isFinite)||startSeconds<0||periodSeconds<=0||crossfadeSeconds<=0||crossfadeSeconds>=periodSeconds||duration<=0)throw Error('Invalid clean music loop.');
 const start=Math.round(startSeconds*sampleRate),period=Math.round(periodSeconds*sampleRate),fade=Math.round(crossfadeSeconds*sampleRate),length=period+fade;
 const samples=Math.ceil(duration*sampleRate),count=Math.max(1,Math.ceil(samples/period));
 const base=`[0:a]aresample=${sampleRate},asetpts=N/SR/TB,atrim=start_sample=${start}:end_sample=${start+length},asetpts=N/SR/TB,aformat=sample_fmts=fltp:channel_layouts=stereo`;
 // Blend the look-ahead tail into the opening of ONE period, then repeat that
 // finite buffer. This retains the musical period and bounds memory use.
 const filter=base+',asplit=2[clean-body][clean-tail];'+
 `[clean-body]atrim=end_sample=${period},asetpts=N/SR/TB,afade=t=in:ns=${fade}[loop-body];`+
 `[clean-tail]atrim=start_sample=${period}:end_sample=${length},asetpts=N/SR/TB,afade=t=out:ns=${fade}[loop-tail];`+
 `[loop-body][loop-tail]amix=inputs=2:normalize=0:duration=longest:dropout_transition=0,aloop=loop=-1:size=${period}:start=0,atrim=end_sample=${samples},asetpts=N/SR/TB[music-source]`;
 return {filter,repetitions:count,periodSamples:period,crossfadeSamples:fade,sourceStartSeconds:start/sampleRate,sourceEndSeconds:(start+length)/sampleRate};
}
