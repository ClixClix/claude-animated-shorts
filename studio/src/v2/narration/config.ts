export class NarrationConfigError extends Error{}
export type Series='in_this_town'|'what_if_cats';
export type VoiceSettings={stability:number;similarity_boost:number;style:number;use_speaker_boost:boolean;speed:number};
export type Narrator={provider:'elevenlabs';voiceName:string;voiceId:string;modelId:string;direction:string;settings:VoiceSettings};
/** API synthesis always stays natural. These controls are applied offline to the original take. */
export type PlaybackSettings={speed:number;pitchSemitones:number;mode?:'independent'|'varispeed'};
export const PLAYBACK:Readonly<Record<Series,Readonly<PlaybackSettings>>>=Object.freeze({
 in_this_town:Object.freeze({speed:1.35,pitchSemitones:0,mode:'varispeed'}),
 what_if_cats:Object.freeze({speed:1,pitchSemitones:0}),
});
export function playbackFor(series:string,override:Partial<PlaybackSettings>={}):PlaybackSettings{
 if(!Object.prototype.hasOwnProperty.call(PLAYBACK,series))throw new NarrationConfigError('Invalid playback series.');
 if(!override||typeof override!=='object'||Array.isArray(override)||Object.keys(override).some(k=>!['speed','pitchSemitones','mode'].includes(k)))throw new NarrationConfigError('Invalid playback overrides.');
 const p={...PLAYBACK[series as Series],...override};
 if(!Number.isFinite(p.speed)||p.speed<0.5||p.speed>2||!Number.isFinite(p.pitchSemitones)||Math.abs(p.pitchSemitones)>12)throw new NarrationConfigError('Playback speed must be 0.5–2 and pitch must be -12–12 semitones.');
 if(p.mode!==undefined&&p.mode!=='independent'&&p.mode!=='varispeed')throw new NarrationConfigError('Invalid playback mode.');
 if(p.mode==='varispeed'&&p.pitchSemitones!==0)throw new NarrationConfigError('Straight varispeed uses no separate pitch shift. Select independent mode for separate pitch control.');
 return p;
}
/** Explicit archival fallback only: never silently substitute a different narrator. */
export const SAWYER_FALLBACK=Object.freeze({
 narrator:Object.freeze({provider:'elevenlabs' as const,voiceName:'Sawyer — Midnight Storyteller',voiceId:'8dEUmyPMdDdK91vboYih',modelId:'eleven_multilingual_v2',direction:'Intimate, cinematic, warm; natural punctuation and suspense, never theatrical.',settings:Object.freeze({stability:0.60,similarity_boost:0.75,style:0.15,use_speaker_boost:true,speed:1})}),
 playback:Object.freeze({speed:1,pitchSemitones:0}),
});
export const NARRATORS:Readonly<Record<Series,Narrator>>={
 in_this_town:{provider:'elevenlabs',voiceName:'Adam — In This Town',voiceId:'pNInz6obpgDQGcFmaJgB',modelId:'eleven_multilingual_v2',direction:'Clear, confident narration at natural pace; punctuation guides delivery.',settings:{stability:0.50,similarity_boost:0.75,style:0,use_speaker_boost:true,speed:1}},
 // Recovered from V1's locked narrator_voice.json and generation metadata at 3dd6cd0.
 // V1 explicitly sent stability, similarity and speed; style/boost inherit API defaults.
 what_if_cats:{provider:'elevenlabs',voiceName:'Daniel — Original What If Cats narrator',voiceId:'onwK4e9ZLuTAKqWW03F9',modelId:'eleven_multilingual_v2',direction:'Conversational, playful; preserve setup and punchline pauses without exaggeration.',settings:{stability:0.72,similarity_boost:0.70,style:0,use_speaker_boost:true,speed:1}},
};
for(const n of Object.values(NARRATORS)){Object.freeze(n.settings);Object.freeze(n);}Object.freeze(NARRATORS);
export const TEST_SCRIPTS:Record<Series,string>={
 in_this_town:"In this town, every café closed at midnight. Except ours. One night, a frightened kitten appeared at the door. She didn't need coffee. She just needed somewhere warm.",
 what_if_cats:"Essie thought opening a cat café would be easy. Then Latte broke the espresso machine, Mocha refused to work, and somehow... they owed fifty dollars in catnip.",
};
export function narratorFor(series:string,override:Partial<Omit<Narrator,'settings'|'provider'>>&{settings?:Partial<VoiceSettings>}={}):Narrator{
 if(!override||typeof override!=='object'||Array.isArray(override))throw new NarrationConfigError('Narrator overrides must be an object.');
 if(!Object.prototype.hasOwnProperty.call(NARRATORS,series))throw new NarrationConfigError('Invalid series. Use in_this_town or what_if_cats.');
 if(Object.keys(override).some(k=>!['voiceName','voiceId','modelId','direction','settings'].includes(k)))throw new NarrationConfigError('Unknown narrator override field.');
 if(override.settings&&Object.keys(override.settings).some(k=>!['stability','similarity_boost','style','use_speaker_boost','speed'].includes(k)))throw new NarrationConfigError('Unknown voice setting.');
 const b=NARRATORS[series as Series],n={...b,...override,settings:{...b.settings,...override.settings}};
 if(!/^[A-Za-z0-9]{20}$/.test(n.voiceId))throw new NarrationConfigError('Invalid ElevenLabs voice ID.');
 if(!/^[a-z0-9_]+$/.test(n.modelId))throw new NarrationConfigError('Invalid model ID.');
 for(const k of ['stability','similarity_boost','style'] as const)if(!Number.isFinite(n.settings[k])||n.settings[k]<0||n.settings[k]>1)throw new NarrationConfigError(`Invalid ${k}: expected 0–1.`);
 if(n.settings.speed!==1)throw new NarrationConfigError('Synthesize at natural 1.0× speed. Configure independent offline speed/pitch with playbackFor.');
 if(typeof n.settings.use_speaker_boost!=='boolean')throw new NarrationConfigError('Invalid speaker boost setting.');
 return n;
}
