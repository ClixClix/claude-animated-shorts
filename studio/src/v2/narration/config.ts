export class NarrationConfigError extends Error{}
export type Series='in_this_town'|'what_if_cats';
export type VoiceSettings={stability:number;similarity_boost:number;style:number;use_speaker_boost:boolean;speed:number};
export type Narrator={provider:'elevenlabs';voiceName:string;voiceId:string;modelId:string;direction:string;settings:VoiceSettings};
export const NARRATORS:Readonly<Record<Series,Narrator>>={
 in_this_town:{provider:'elevenlabs',voiceName:'Sawyer — Midnight Storyteller',voiceId:'8dEUmyPMdDdK91vboYih',modelId:'eleven_multilingual_v2',direction:'Intimate, cinematic, warm; natural punctuation and suspense, never theatrical.',settings:{stability:0.60,similarity_boost:0.75,style:0.15,use_speaker_boost:true,speed:1}},
 what_if_cats:{provider:'elevenlabs',voiceName:'Darian — Warm Grounded Storyteller',voiceId:'gOupLcAkjEnguROwi4oS',modelId:'eleven_multilingual_v2',direction:'Conversational, playful; preserve setup and punchline pauses without exaggeration.',settings:{stability:0.50,similarity_boost:0.75,style:0.20,use_speaker_boost:true,speed:1}},
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
 if(n.settings.speed!==1)throw new NarrationConfigError('These series require natural 1.0× speed. Adjust visual timing instead.');
 if(typeof n.settings.use_speaker_boost!=='boolean')throw new NarrationConfigError('Invalid speaker boost setting.');
 return n;
}
