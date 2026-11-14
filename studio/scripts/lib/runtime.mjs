import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

export const studioRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Use Node.js 24.x; this handoff was tested with 24.22.1.');
process.chdir(studioRoot);
// Project JSON/reports are UTF-8 on every platform, including Windows PowerShell 5.1.
// Inherit this in every Python child (QA, boards, Foley); never use the Windows ACP.
process.env.PYTHONUTF8='1';
process.env.PYTHONIOENCODING='utf-8';
for(const name of ['.env','.env.local'])if(fs.existsSync(path.join(studioRoot,name)))process.loadEnvFile(path.join(studioRoot,name));
const candidates=process.platform==='win32'?[
 path.join(process.env.PROGRAMFILES??'C:\\Program Files','Google/Chrome/Application/chrome.exe'),
 path.join(process.env['PROGRAMFILES(X86)']??'C:\\Program Files (x86)','Microsoft/Edge/Application/msedge.exe'),
 path.join(process.env.LOCALAPPDATA??os.homedir(),'Google/Chrome/Application/chrome.exe'),
]:[];
export const browserExecutable=process.env.CHROME||candidates.find(p=>fs.existsSync(p))||null;
export const chromiumOptions={gl:process.env.V2_GL||(process.platform==='win32'?'angle':'swangle')};
export function renderConcurrency(value=process.env.V2_RENDER_CONCURRENCY??'2'){
 const n=Number(value);if(!Number.isInteger(n)||n<1||n>4)throw Error('Use rendering concurrency 1–4. Start with 2 on a 32 GB PC.');return n;
}
