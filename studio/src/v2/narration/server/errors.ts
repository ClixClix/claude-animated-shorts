export class NarrationError extends Error{
 constructor(public code:string,message:string,public retryAfterSeconds?:number){super(message);this.name='NarrationError';}
}
export function providerError(status:number,body:unknown,retryAfter:string|null):NarrationError{
 const detail=(body as {detail?:{status?:unknown}})?.detail;
 const tag=typeof detail?.status==='string'?detail.status:'';
 if(tag==='quota_exceeded'||tag==='insufficient_credits'||status===402)return new NarrationError('INSUFFICIENT_CREDITS','ElevenLabs credits are insufficient. No automatic paid retry was made.');
 if(status===401||tag==='invalid_api_key')return new NarrationError('INVALID_CREDENTIAL','ElevenLabs rejected the credential. Check the rotated Codespaces secret and required permissions.');
 if(status===403)return new NarrationError('ACCESS_DENIED','ElevenLabs or the network proxy denied access. Check voice/account permissions and api.elevenlabs.io access.');
 if(status===404||tag==='voice_not_found')return new NarrationError('VOICE_UNAVAILABLE','The requested voice or resource is unavailable to this account. No substitute was selected.');
 if(status===429){const seconds=retryAfter&&/^\d+$/.test(retryAfter)?Number(retryAfter):undefined;return new NarrationError('RATE_LIMIT','ElevenLabs rate limit reached. Wait before deliberately retrying; generation was not retried automatically.',seconds);}
 return new NarrationError('PROVIDER_FAILURE',`ElevenLabs request failed (HTTP ${status}). Request and response bodies are withheld.`);
}
