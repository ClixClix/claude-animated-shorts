import {Narrator,NARRATORS} from '../config';
import {Alignment} from '../timing';
import {NarrationError,providerError} from './errors';
if(typeof window!=='undefined')throw new Error('The ElevenLabs client is server-only.');
export type Model={model_id:string;can_do_text_to_speech:boolean;can_use_style?:boolean;can_use_speaker_boost?:boolean;name?:string;maximum_text_length_per_request?:number;max_characters_request_subscribed_user?:number;max_characters_request_free_user?:number};
export type Verification={checkedAt:string;voices:{voiceId:string;name:string}[];models:Model[]};
export type GenerationParameters={outputFormat:'mp3_44100_128';applyTextNormalization:'auto'|'on'|'off';seed?:number};
export const DEFAULT_PARAMETERS:GenerationParameters={outputFormat:'mp3_44100_128',applyTextNormalization:'auto'};
export type TimestampResponse={audio_base64:string;alignment?:Alignment;normalized_alignment?:Alignment};
export type ClientOptions={apiKey?:string;rotationConfirmed:boolean;fetcher?:typeof fetch};
export class ElevenLabsClient{
 private key:string;private fetcher:typeof fetch;
 constructor(options:ClientOptions){
  if(!options.apiKey)throw new NarrationError('MISSING_CREDENTIAL','ELEVENLABS_API_KEY is missing. Add a newly rotated key as a Codespaces secret. Never paste it into chat.');
  if(!options.rotationConfirmed)throw new NarrationError('ROTATION_REQUIRED','Confirm that ELEVENLABS_API_KEY was newly rotated before authenticated requests.');
  this.key=options.apiKey;this.fetcher=options.fetcher??fetch;
 }
 private async request(path:string,method='GET',body?:unknown):Promise<unknown>{
  if(!path.startsWith('/v1/')||path.includes('://'))throw new NarrationError('INVALID_ENDPOINT','Invalid provider endpoint.');
  let response:Response;
  try{response=await this.fetcher('https://api.elevenlabs.io'+path,{method,headers:{'xi-api-key':this.key,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(120000)});}
  catch{throw new NarrationError('NETWORK_FAILURE','ElevenLabs could not be reached or the request timed out. Generation was not retried; check cache/provider history before retrying an uncertain paid request.');}
  let json:unknown;try{const text=await response.text();if(text.length>90_000_000)throw new Error();json=JSON.parse(text);}catch{if(!response.ok)throw providerError(response.status,{},response.headers.get('retry-after'));throw new NarrationError('INVALID_RESPONSE','ElevenLabs returned an invalid or oversized JSON response.');}
  if(!response.ok)throw providerError(response.status,json,response.headers.get('retry-after'));
  return json;
 }
 async verify(extraVoices:string[]=[]):Promise<Verification>{
  const models=await this.request('/v1/models');if(!Array.isArray(models))throw new NarrationError('INVALID_RESPONSE','Invalid ElevenLabs model catalog.');
  const voices=[];for(const id of new Set([...Object.values(NARRATORS).map(n=>n.voiceId),...extraVoices])){
   if(!/^[A-Za-z0-9]{20}$/.test(id))throw new NarrationError('INVALID_VOICE','Invalid voice ID.');
   const v=await this.request(`/v1/voices/${id}`) as {voice_id?:unknown;name?:unknown};
   if(v.voice_id!==id||typeof v.name!=='string')throw new NarrationError('VOICE_UNAVAILABLE',`Voice ${id} could not be verified. No substitute was selected.`);
   voices.push({voiceId:id,name:v.name});
  }
  return {checkedAt:new Date().toISOString(),voices,models:models.map((raw:Model)=>({model_id:raw.model_id,name:raw.name,can_do_text_to_speech:raw.can_do_text_to_speech,can_use_style:raw.can_use_style,can_use_speaker_boost:raw.can_use_speaker_boost,maximum_text_length_per_request:raw.maximum_text_length_per_request,max_characters_request_subscribed_user:raw.max_characters_request_subscribed_user,max_characters_request_free_user:raw.max_characters_request_free_user}))};
 }
 validate(n:Narrator,script:string,verification:Verification,params:GenerationParameters){
  const model=verification.models.find(m=>m.model_id===n.modelId);
  if(!model?.can_do_text_to_speech)throw new NarrationError('MODEL_UNAVAILABLE','Selected model is not available for text-to-speech.');
  // Only models whose speed/normalization adapter has been established are allowed. Unknown models fail closed.
  if(!['eleven_multilingual_v2','eleven_flash_v2_5','eleven_turbo_v2_5'].includes(n.modelId))throw new NarrationError('MODEL_SETTINGS_UNVERIFIED','This model needs an explicit capability adapter before generation.');
  if(model.can_use_style!==true&&n.settings.style!==0)throw new NarrationError('UNSUPPORTED_SETTING','Selected model does not confirm style support. Choose style=0 explicitly or a compatible model.');
  if(model.can_use_speaker_boost!==true&&n.settings.use_speaker_boost)throw new NarrationError('UNSUPPORTED_SETTING','Selected model does not confirm speaker boost support. Disable it explicitly or choose a compatible model.');
  const limit=Math.min(model.maximum_text_length_per_request??model.max_characters_request_subscribed_user??5000,5000);
  if(!script.trim()||script.length>limit)throw new NarrationError('INVALID_SCRIPT',`Script must contain 1–${limit} characters for this generation adapter.`);
  if(/<[^>]+>|\[[^\]]+\]/.test(script))throw new NarrationError('UNSUPPORTED_MARKUP','Use plain text and punctuation; this adapter does not accept SSML or emotion tags.');
  if(params.outputFormat!=='mp3_44100_128'||!['auto','on','off'].includes(params.applyTextNormalization)||params.seed!==undefined&&(!Number.isInteger(params.seed)||params.seed<0||params.seed>4294967295))throw new NarrationError('INVALID_PARAMETERS','Invalid output, normalization, or seed parameters.');
  if(!verification.voices.some(v=>v.voiceId===n.voiceId))throw new NarrationError('VOICE_UNAVAILABLE','Selected override voice was not verified.');
 }
 async synthesize(n:Narrator,script:string,params:GenerationParameters,v:Verification,paidApproved:boolean):Promise<TimestampResponse>{
  if(!paidApproved)throw new NarrationError('PAID_APPROVAL_REQUIRED','Paid ElevenLabs synthesis requires explicit user authorization.');
  this.validate(n,script,v,params);
  const voice_settings:Record<string,unknown>={...n.settings};const model=v.models.find(m=>m.model_id===n.modelId)!;
  if(model.can_use_style!==true)delete voice_settings.style;if(model.can_use_speaker_boost!==true)delete voice_settings.use_speaker_boost;
  return await this.request(`/v1/text-to-speech/${n.voiceId}/with-timestamps?output_format=${params.outputFormat}`,'POST',{text:script,model_id:n.modelId,voice_settings,apply_text_normalization:params.applyTextNormalization,...(params.seed===undefined?{}:{seed:params.seed})}) as TimestampResponse;
 }
}
