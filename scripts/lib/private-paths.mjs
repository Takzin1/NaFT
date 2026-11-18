/* P80 · shared guards for local CLIs: outputs and private inputs never live inside the repository. */
import {existsSync,realpathSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {dirname,resolve,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..','..');
export function fail(prefix,c){throw new Error(prefix+':'+c);}
export function outsideRepo(p,code,prefix='P80_CLI_BLOCKED'){
 if(typeof p!=='string'||!p.trim())fail(prefix,code+'_PATH_REQUIRED');
 const f=resolve(p),parent=realpathSync(dirname(f));
 if(f===ROOT||f.startsWith(ROOT+sep)||parent===ROOT||parent.startsWith(ROOT+sep))fail(prefix,code+'_CANNOT_BE_INSIDE_REPOSITORY');
 if(existsSync(f))fail(prefix,code+'_EXISTS');
 return f;
}
export function readJson(p,code,prefix='P80_CLI_BLOCKED',max=16*1024*1024){
 if(!p||!existsSync(p)||!statSync(p).isFile()||statSync(p).size>max)fail(prefix,code+'_FILE');
 try{return JSON.parse(readFileSync(p,'utf8'));}catch{fail(prefix,code+'_JSON');}
}
export function writePrivate(f,text){writeFileSync(f,text,{mode:0o600,flag:'wx'});}
export function parseArgs(raw,allowed,prefix){
 const o={};if(raw.length%2!==0)fail(prefix,'ARGUMENT_PAIRS');
 for(let i=0;i<raw.length;i+=2){const k=raw[i].slice(2);if(!raw[i].startsWith('--')||!allowed.includes(k)||k in o)fail(prefix,'UNKNOWN_OPTION:'+raw[i]);o[k]=raw[i+1];}
 return o;
}
export function compilerContext(extra=[]){
 const ctx={console,TextEncoder,TextDecoder,Uint8Array};vm.createContext(ctx);
 for(const f of ['src/mrv-core.js','src/methodology-packs.js','src/mrv-compiler.js','src/forest-packs.js','src/ag005-text-packs.js','src/reverification-worklist.js',...extra])
  vm.runInContext(readFileSync(join(ROOT,f),'utf8'),ctx,{filename:f});
 return ctx;
}
