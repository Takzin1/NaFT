import {robust,claim,optimize} from './decision.mjs';
const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n);
const base={"areaHa":10,"baselinePerHa":2,"adoption":0.8,"reductionLow":0.15,"reductionExpected":0.3,"reductionHigh":0.4,"addedEmissionsPerHa":0.05,"costPerHa":3000};
const groups=[{id:'Demo A (10 ha)',options:[{id:'Full plan',input:base},{id:'Half plan',input:{...base,adoption:.4}}]},{id:'Demo B (5 ha)',options:[{id:'Full plan',input:{...base,areaHa:5,costPerHa:4000}},{id:'Half plan',input:{...base,areaHa:5,adoption:.4,costPerHa:4000}}]},{id:'Demo C (4 ha)',options:[{id:'Trial',input:{...base,areaHa:4,adoption:.5,baselinePerHa:1.5}}]}];
let report=null;
function reset(){report=null;$('decision-export').disabled=true;$('decision-result').replaceChildren();$('decision-frontier').replaceChildren();}
function line(s){const p=document.createElement('p');p.textContent=s;$('decision-result').append(p)}
function run(){reset();$('decision-error').textContent='';try{
 if(!$('decision-form').checkValidity())throw Error('Invalid assumptions');
 const budget=$('decision-budget').valueAsNumber,spread=Object.fromEntries(['baseline','adoption','additional'].map(k=>[k,$('decision-'+k).valueAsNumber]));
 const result=optimize(groups,budget,spread),r=robust(base,spread),c=claim(base,spread);
 line('Demo A sensitivity: '+fmt(r.range.low)+' / '+fmt(r.range.expected)+' / '+fmt(r.range.high)+' tCO₂e (low / expected / high).');
 line('Largest one-at-a-time sensitivity: '+r.sensitivity[0][0]+' ('+fmt(r.sensitivity[0][1])+' tCO₂e).');line(c.statement);
 line('Selected portfolio: '+result.best.selected.map(x=>x.group+': '+(x.option??'No action')).join('; '));
 line('Upper cost: ¥'+fmt(result.best.cost)+' | Net low / expected / high: '+[result.best.low,result.best.expected,result.best.high].map(fmt).join(' / ')+' tCO₂e. Not verified.');
 for(const row of result.frontier){const tr=document.createElement('tr');for(const v of [row.cost,row.low,row.expected]){const td=document.createElement('td');td.textContent=fmt(v);tr.append(td)}$('decision-frontier').append(tr)}
 report={schema:'greenshift-decision-v1',groups,spread,robust:r,claim:c,portfolio:result};$('decision-export').disabled=false;
 }catch(e){$('decision-error').textContent=e.message}}
 $('decision-form').addEventListener('submit',e=>{e.preventDefault();run()});$('decision-form').addEventListener('input',()=>{reset();$('decision-error').textContent='Recalculate after changing inputs.'});
 $('decision-export').addEventListener('click',()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='greenshift-decision-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});run();
