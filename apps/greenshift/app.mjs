import {simulate,compare} from './engine.mjs';
import {addRecord,evidenceStatus,digest,scopeHash} from './evidence.mjs';
const defs=[
['areaHa','Field area (ha)',10,.01,100000,.01],
['baselinePerHa','Baseline methane emissions (tCO₂e/ha)',2,0,1000,.01],
['adoption','Adoption fraction (0–1)',.8,0,1,.01],
['reductionLow','Low reduction fraction (0–1)',.15,0,1,.01],
['reductionExpected','Expected reduction fraction (0–1)',.3,0,1,.01],
['reductionHigh','High reduction fraction (0–1)',.4,0,1,.01],
['addedEmissionsPerHa','Additional emissions (tCO₂e/treated ha)',.05,0,1000,.01],
['costPerHa','Incremental cost (JPY/treated ha)',3000,0,100000000,1]
];
const $=id=>document.getElementById(id), num=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
for(const [key,name,value,min,max,step] of defs){
 const label=document.createElement('label'), input=document.createElement('input');
 label.textContent=name; input.type='number';input.id=key;input.value=value;input.min=min;input.max=max;input.step=step;input.required=true; label.append(input);$('fields').append(label);
}
let result=null, records=[], review=null, scope=null, revision=0, busy=false;
const evError=message=>{$('ev-error').textContent=message};
function renderEvidence(){const s=evidenceStatus(records,review,scope);$('ev-status').textContent='Status: '+s.status.replaceAll('_',' ')+(s.missing.length?' | Missing: '+s.missing.join(', '):'');$('ev-list').replaceChildren();for(const rec of records){const li=document.createElement('li'),remove=document.createElement('button');li.textContent=rec.kind+' · '+rec.bytes+' bytes · '+rec.sha256.slice(0,12)+'… ';remove.textContent='Remove';remove.type='button';remove.disabled=busy;remove.addEventListener('click',()=>{records=records.filter(x=>x.sha256!==rec.sha256);refreshScope()});li.append(remove);$('ev-list').append(li)}$('ev-review').disabled=busy||!scope||s.missing.length>0||!$('ev-confirm').checked;$('export').disabled=busy||!result||!scope;$('ev-add').disabled=busy;$('ev-demo').disabled=busy;}
async function refreshScope(){const token=++revision;scope=null;review=null;$('ev-confirm').checked=false;renderEvidence();if(!result)return;try{const hash=await scopeHash(result.scenario.assumptions,records);if(token===revision){scope=hash;renderEvidence()}}catch(e){if(token===revision)evError(e.message)}}
function run(){
 result=null;refreshScope();$('metrics').replaceChildren();$('ranking').replaceChildren();$('warning').textContent='';$('error').textContent='';
 try{
 if(!$('scenario').checkValidity())throw Error('Enter valid values for all fields.');
 const input=Object.fromEntries(defs.map(([k])=>[k,$(k).valueAsNumber]));
 const r=simulate(input), ranking=compare([{id:'Selected',input},{id:'Half adoption',input:{...input,adoption:input.adoption/2}},{id:'No action',input:{...input,adoption:0}}]);
 for(const [label,value] of [['Baseline',num(r.baselineTco2e)+' tCO₂e'],['Projected',num(r.projectedTco2e)+' tCO₂e'],['Net reduction',num(r.netReductionTco2e.expected)+' tCO₂e'],['Incremental cost','¥'+num(r.costJpy)]]){
 const card=document.createElement('div'), title=document.createElement('span'), strong=document.createElement('strong');title.textContent=label;strong.textContent=value;card.append(title,strong);$('metrics').append(card);}
 for(const o of ranking){const tr=document.createElement('tr');for(const v of [o.id,num(o.netReductionTco2e.low),num(o.netReductionTco2e.expected),num(o.netReductionTco2e.high),num(o.costJpy)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('ranking').append(tr)}
 $('warning').textContent=r.warning??'Positive net benefit across the entered assumptions. Still unverified.';
 result={scenario:r,alternatives:ranking};refreshScope();
 }catch(e){$('error').textContent=e.message;}
}
$('scenario').addEventListener('submit',e=>{e.preventDefault();run()});
$('scenario').addEventListener('input',()=>{result=null;refreshScope();$('metrics').replaceChildren();$('ranking').replaceChildren();$('warning').textContent='Recalculate to view updated results.';});
$('export').addEventListener('click',()=>{if(!result||!scope||busy)return;const bundle={schema:'greenshift-evidence-v1',classification:'illustrative_projection',scope,scenario:result.scenario,alternatives:result.alternatives,evidence:records,review,status:evidenceStatus(records,review,scope),limitations:['metadata only; no original files included','self-review not independent verification','no certified or verified reduction']};const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='greenshift-evidence-bundle.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('ev-confirm').addEventListener('change',renderEvidence);
$('ev-add').addEventListener('click',async()=>{if(busy)return;evError('');const file=$('ev-file').files[0],kind=$('ev-kind').value;if(!file){evError('Select a synthetic file first.');return}if(file.size<1||file.size>10*1024*1024){evError('File must be 1 byte–10 MiB.');return}busy=true;renderEvidence();try{records=addRecord(records,{kind,bytes:file.size,sha256:await digest(await file.arrayBuffer())});$('ev-file').value='';await refreshScope()}catch(e){evError(e.message)}finally{busy=false;renderEvidence()}});
$('ev-demo').addEventListener('click',async()=>{if(busy)return;busy=true;renderEvidence();evError('');try{let next=[];for(const [kind,value] of [['baseline_history','SYNTHETIC: 2024=7 days; 2025=8 days'],['activity_log','SYNTHETIC: 2026 trial record, not measured'],['field_context','SYNTHETIC: demo field, no real coordinates']]){const bytes=new TextEncoder().encode(value);next=addRecord(next,{kind,bytes:bytes.length,sha256:await digest(bytes)})}records=next;await refreshScope()}catch(e){evError(e.message)}finally{busy=false;renderEvidence()}});
$('ev-review').addEventListener('click',()=>{if(busy||!scope||!$('ev-confirm').checked||evidenceStatus(records,null,scope).missing.length)return;review={scope,decision:'reviewed',reviewer:'local_self_review',recordedAt:new Date().toISOString()};renderEvidence()});
run();
