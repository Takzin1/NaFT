import {simulate,compare} from './engine.mjs';
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
let result=null;
function run(){
 result=null;$('export').disabled=true;$('metrics').replaceChildren();$('ranking').replaceChildren();$('warning').textContent='';$('error').textContent='';
 try{
 if(!$('scenario').checkValidity())throw Error('Enter valid values for all fields.');
 const input=Object.fromEntries(defs.map(([k])=>[k,$(k).valueAsNumber]));
 const r=simulate(input), ranking=compare([{id:'Selected',input},{id:'Half adoption',input:{...input,adoption:input.adoption/2}},{id:'No action',input:{...input,adoption:0}}]);
 for(const [label,value] of [['Baseline',num(r.baselineTco2e)+' tCO₂e'],['Projected',num(r.projectedTco2e)+' tCO₂e'],['Net reduction',num(r.netReductionTco2e.expected)+' tCO₂e'],['Incremental cost','¥'+num(r.costJpy)]]){
 const card=document.createElement('div'), title=document.createElement('span'), strong=document.createElement('strong');title.textContent=label;strong.textContent=value;card.append(title,strong);$('metrics').append(card);}
 for(const o of ranking){const tr=document.createElement('tr');for(const v of [o.id,num(o.netReductionTco2e.low),num(o.netReductionTco2e.expected),num(o.netReductionTco2e.high),num(o.costJpy)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('ranking').append(tr)}
 $('warning').textContent=r.warning??'Positive net benefit across the entered assumptions. Still unverified.';
 result={scenario:r,alternatives:ranking};$('export').disabled=false;
 }catch(e){$('error').textContent=e.message;}
}
$('scenario').addEventListener('submit',e=>{e.preventDefault();run()});
$('scenario').addEventListener('input',()=>{result=null;$('export').disabled=true;$('metrics').replaceChildren();$('ranking').replaceChildren();$('warning').textContent='Recalculate to view updated results.';});
$('export').addEventListener('click',()=>{if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='greenshift-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
run();
