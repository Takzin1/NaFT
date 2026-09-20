// Synthetic, single-process render benchmark. Run tests/extract-app-js.py first.
// An optional extracted baseline script path allows before/after comparison.
// No browser FPS, concurrent-user or production-performance claim.
const fs=require('fs'),vm=require('vm');
global.window={addEventListener(){},scrollTo(){}};global.location={hash:'#/'};
global.document={getElementById(){return {innerHTML:'',files:[],value:''};},querySelectorAll(){return [];}};
vm.runInThisContext(fs.readFileSync(process.argv[2]||require('path').join(__dirname,'_app.js'),'utf8'));
setTimeout(async()=>{
 db=seedDB();S.user=findUser('u2');const a=await registerPrimaryActivity(primaryExample());S.primaryActivityId=a.id;
 const bytes=new TextEncoder().encode('SYNTHETIC DEMO benchmark');
 for(const spec of assessAG005(a).evidence_completeness.missing){const [type,y]=spec.split(':');await attachPrimaryEvidence(a.id,{size:bytes.length,name:'fixture.txt',arrayBuffer:async()=>bytes.buffer},type,Number(y),'SYNTHETIC DEMO benchmark');}
 for(let i=0;i<292;i++){const e=primaryClone(db.evidence_manifests[i%8]);e.evidence_id='bench_ev_'+i;e.source+='x'.repeat(500);e.manifest_hash=primaryHash(manifestPayload(e));db.evidence_manifests.push(e);}
 for(let i=0;i<99;i++){const other=primaryClone(a);other.id='bench_act_'+i;other.field_id='BENCH-'+i;db.activities.push(other);for(let j=0;j<8;j++){const e=primaryClone(db.evidence_manifests[j]);e.activity_id=other.id;e.evidence_id='bench_other_'+i+'_'+j;e.manifest_hash=primaryHash(manifestPayload(e));db.evidence_manifests.push(e);}}
 for(let i=0;i<1000;i++)audit('benchmark','activity',a.id,'synthetic event '+i);
 await runAG005(a.id);S.user=findUser('u4');await reviewPrimaryActivity(a.id,'approved','I acknowledge synthetic benchmark evidence and unresolved configuration.');
 const before=primaryHash(db),samples=[];let html;
 for(let i=0;i<9;i++){const start=performance.now();html=pgPrimaryMRV();samples.push(performance.now()-start);}
 samples.sort((a,b)=>a-b);
 console.log(JSON.stringify({activities:db.activities.length,evidence:db.evidence_manifests.length,selected_evidence:300,audit:db.audit_logs.length,median_ms:+samples[4].toFixed(2),html_bytes:Buffer.byteLength(html),read_only:before===primaryHash(db)}));
},20);
