#!/usr/bin/env node
/* P77 private local state CLI; never persist field/polygon identifiers in GitHub.
 * No API calls. Every approval requires an explicit research-only human record.
 */
import {readFileSync,existsSync,statSync,writeFileSync,renameSync,unlinkSync,realpathSync} from 'node:fs';
import {dirname,resolve,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {emptyFieldRegistry,assertFieldRegistry,addField,stageObservation,proposeLink,reviewLink,attestLineage,addFieldEvidence,newFieldId,buildPublicReceipt} from './lib/p77-field-identity.mjs';
import {importLocalPolygonDataset} from './p77-fude-local-intake.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
function fail(c){throw new Error('P77_FIELD_CLI_BLOCKED:'+c);}
function must(x,c){if(!x)fail(c);}
function argumentsOf(raw){
 const opts={};
 must(raw.length%2===0,'ARGUMENT_PAIRS');
 for(let i=0;i<raw.length;i+=2){
  const k=raw[i].slice(2);
  must(raw[i].startsWith('--')&&['action','state','payload','input','year','pref','max'].includes(k)&&!(k in opts),'UNKNOWN_OPTION');
  opts[k]=raw[i+1];
 }
 must(opts.action&&opts.state,'ACTION_AND_STATE_REQUIRED');
 must(['init','add-field','import','propose','review','lineage','evidence','receipt'].includes(opts.action),'UNKNOWN_ACTION');
 return opts;
}
function privatePath(original){
 must(typeof original==='string'&&original.trim(),'STATE_PATH_REQUIRED');
 const f=resolve(original),realParent=realpathSync(dirname(f)),parent=ROOT;
 must(f!==parent&&!f.startsWith(parent+sep),'STATE_CANNOT_BE_INSIDE_REPOSITORY');
 must(realParent!==parent&&!realParent.startsWith(parent+sep),'STATE_PARENT_LINKS_TO_REPOSITORY');
 if(existsSync(f))must(realpathSync(f)===f,'STATE_SYMLINK_NOT_ALLOWED');
 return f;
}
function loadPrivate(f){
 must(existsSync(f)&&statSync(f).isFile()&&statSync(f).size<16*1024*1024,'STATE_MISSING_OR_TOO_LARGE');
 let state;try{state=JSON.parse(readFileSync(f,'utf8'));}catch{fail('INVALID_STATE_JSON');}
 return assertFieldRegistry(state);
}
function persistPrivate(file,state){
 assertFieldRegistry(state);
 const data=JSON.stringify(state,null,2)+'\n';
 must(Buffer.byteLength(data)<16*1024*1024,'STATE_TOO_LARGE');
 const tmp=file+'.'+randomUUID()+'.tmp';
 try{writeFileSync(tmp,data,{flag:'wx',mode:0o600});renameSync(tmp,file);}
 catch(e){if(existsSync(tmp))unlinkSync(tmp);throw e;}
}
function payloadFile(f){
 must(typeof f==='string'&&existsSync(f)&&statSync(f).size<=32768,'PAYLOAD_FILE_REQUIRED');
 let x;try{x=JSON.parse(readFileSync(f,'utf8'));}catch{fail('PAYLOAD_INVALID_JSON');}
 must(x&&typeof x==='object'&&!Array.isArray(x),'PAYLOAD_OBJECT');
 return x;
}
export async function runP77FieldCli(o){
 const file=privatePath(o.state);
 if(o.action==='init'){
  must(!existsSync(file),'REFUSE_OVERWRITE_PRIVATE_STATE');
  const state=emptyFieldRegistry();
  writeFileSync(file,JSON.stringify(state,null,2)+'\n',{flag:'wx',mode:0o600});
  return buildPublicReceipt(state);
 }
 let state=loadPrivate(file);
 if(o.action==='receipt')return buildPublicReceipt(state);
 if(o.action==='import'){
  must(o.input&&o.year&&o.pref,'IMPORT_ARGS');
  const imported=await importLocalPolygonDataset({input_path:o.input,issue_year:Number(o.year),prefecture_code:o.pref,max_features:o.max?Number(o.max):1000});
  for(const observation of imported.state.observations)state=stageObservation(state,observation);
  persistPrivate(file,state);
  return {...buildPublicReceipt(state),imported_polygons:imported.receipt.decoded_polygons,source_file_sha256:imported.receipt.source_file_sha256,import_data_verified_by_maff:false};
 }
 const payload=payloadFile(o.payload);
 if(o.action==='add-field')state=addField(state,{...payload,field_id:payload.field_id||newFieldId()});
 else if(o.action==='propose')state=proposeLink(state,payload);
 else if(o.action==='review')state=reviewLink(state,payload);
 else if(o.action==='lineage')state=attestLineage(state,payload);
 else if(o.action==='evidence')state=addFieldEvidence(state,payload);
 else fail('UNKNOWN_ACTION');
 persistPrivate(file,state);return buildPublicReceipt(state);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url).replace('file://','')){
 runP77FieldCli(argumentsOf(process.argv.slice(2)))
 .then(r=>process.stdout.write(JSON.stringify(r,null,2)+'\n'))
 .catch(err=>{const message=err.message||'';process.stderr.write((/^P77_(?:FIELD_CLI|FIELD_IDENTITY|FUDE_IMPORT)_BLOCKED:[A-Z0-9_]+$/.test(message)?message:'P77_FIELD_CLI_BLOCKED:INVALID_PRIVATE_REQUEST')+'\n');process.exitCode=1;});
}
