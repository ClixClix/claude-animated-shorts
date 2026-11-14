// Uses Node.js built-ins only. No uploads, API calls, or narration generation.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,createDecipheriv,pbkdf2Sync,timingSafeEqual} from 'node:crypto';
import readline from 'node:readline';
import {Writable} from 'node:stream';

const root=path.dirname(fileURLToPath(import.meta.url));
async function askCode(){
 let muted=false;
 const output=new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk);callback();}});
 const input=readline.createInterface({input:process.stdin,output,terminal:process.stdin.isTTY});
 const code=await new Promise(resolve=>{input.question('Unlock code from your chat: ',resolve);muted=true;});
 input.close();process.stdout.write('\n');return String(code).trim();
}
try{
 const m=JSON.parse(await fs.readFile(path.join(root,'TRANSFER_MANIFEST.json'),'utf8'));
 if(m.version!==1||m.iterations!==600000||m.parts.length>100)throw Error('Unsupported transfer format.');
 const chunks=[];
 for(let i=0;i<m.parts.length;i++){
  const part=m.parts[i],expected=`payload-${String(i+1).padStart(3,'0')}.bin`;
  if(part.name!==expected)throw Error('Unexpected part filename.');
  const bytes=await fs.readFile(path.join(root,expected));
  if(bytes.length!==part.bytes||createHash('sha256').update(bytes).digest('hex')!==part.sha256)throw Error('Damaged download part: '+expected);
  chunks.push(bytes);
 }
 const password=process.env.V2_TRANSFER_PASSWORD||await askCode();
 if(!password)throw Error('An unlock code is required.');
 const key=pbkdf2Sync(password,Buffer.from(m.salt,'base64'),m.iterations,32,'sha256');
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(m.nonce,'base64'));
 decipher.setAAD(Buffer.from('WHAT_IF_CATS_V2_TRANSFER_1'));
 decipher.setAuthTag(Buffer.from(m.tag,'base64'));
 let plain;
 try{plain=Buffer.concat([decipher.update(Buffer.concat(chunks)),decipher.final()]);}catch{throw Error('Unlock failed: incorrect code or damaged transfer.');}
 if(plain.subarray(0,8).toString()!=='V2XFER01')throw Error('Invalid archive header.');
 const lengths=[Number(plain.readBigUInt64BE(8)),Number(plain.readBigUInt64BE(16))];
 if(lengths.some(n=>!Number.isSafeInteger(n)||n<=0)||88+lengths[0]+lengths[1]!==plain.length)throw Error('Invalid archive lengths.');
 const names=['WhatIfCatsV2_Portable_Project.zip','WhatIfCatsV2_Private_Assets.zip'];
 const output=path.join(root,'Restored-V2-Files');await fs.mkdir(output,{recursive:true});let offset=88;
 for(let i=0;i<names.length;i++){
  const bytes=plain.subarray(offset,offset+lengths[i]);offset+=lengths[i];
  const digest=createHash('sha256').update(bytes).digest();
  if(!timingSafeEqual(digest,plain.subarray(24+i*32,56+i*32)))throw Error('Archive checksum failure.');
  const file=path.join(output,names[i]);let exists=false;
  try{const current=await fs.readFile(file);exists=true;if(createHash('sha256').update(current).digest('hex')!==digest.toString('hex'))throw Error('A different file already exists: '+file);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!exists){const pending=file+'.partial';await fs.writeFile(pending,bytes);await fs.rename(pending,file);}
  console.log('Verified and restored: '+file);
 }
 console.log('Done. Both original ZIPs were restored unchanged. Follow START_HERE.md inside the project ZIP.');
}catch(error){console.error(error.message);process.exitCode=1;}
