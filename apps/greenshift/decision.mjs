import {validate,simulate} from './engine.mjs';
function robust(input,spread){
 const p=validate(input);
 if(!spread||typeof spread!=="object")throw TypeError("Uncertainty assumptions required");
 const s={};for(const k of ["baseline","adoption","additional"]){const v=spread[k];if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>1)throw RangeError("Invalid spread: "+k);s[k]=v}
 const bounds=(v,w,cap=Infinity)=>[v*(1-w),Math.min(cap,v*(1+w))];
 const b=bounds(p.baselinePerHa,s.baseline),a=bounds(p.adoption,s.adoption,1),e=bounds(p.addedEmissionsPerHa,s.additional);
 const net=(B,A,R,E)=>p.areaHa*A*(B*R-E);
 const corners=[];for(const B of b)for(const A of a)for(const R of [p.reductionLow,p.reductionHigh])for(const E of e)corners.push(net(B,A,R,E));
 const expected=simulate(p).netReductionTco2e.expected;
 const sensitivity=[
 ["baseline",net(b[1],p.adoption,p.reductionExpected,p.addedEmissionsPerHa)-net(b[0],p.adoption,p.reductionExpected,p.addedEmissionsPerHa)],
 ["adoption",Math.abs(net(p.baselinePerHa,a[1],p.reductionExpected,p.addedEmissionsPerHa)-net(p.baselinePerHa,a[0],p.reductionExpected,p.addedEmissionsPerHa))],
 ["reduction",net(p.baselinePerHa,p.adoption,p.reductionHigh,p.addedEmissionsPerHa)-net(p.baselinePerHa,p.adoption,p.reductionLow,p.addedEmissionsPerHa)],
 ["additional",net(p.baselinePerHa,p.adoption,p.reductionExpected,e[0])-net(p.baselinePerHa,p.adoption,p.reductionExpected,e[1])]
 ].sort((x,y)=>y[1]-x[1]);
 return {classification:"illustrative_projection",range:{low:Math.min(...corners),expected,high:Math.max(...corners)},costUpperJpy:p.areaHa*a[1]*p.costPerHa,sensitivity,assumptions:p,spread:s,verifiedTco2e:null};
}

function claim(input,spread){
 const r=robust(input,spread);
 return {type:"scenario_estimate_only",statement:r.range.low>0?"Positive net reduction across the stated scenario bounds; unverified.":r.range.high<=0?"No positive net reduction across the stated scenario bounds; unverified.":"Net reduction is uncertain and may be nonpositive; unverified.",range:r.range,verifiedTco2e:null,certified:false,independentReview:false,limitations:["Synthetic or user assumptions, not measured data","Bounds are not probabilities or confidence intervals","No official methodology compliance or certification"]};
}

function optimize(groups,budget,spread){
 if(!Number.isSafeInteger(budget)||budget<0||budget>1e12)throw RangeError("Invalid budget");
 if(!Array.isArray(groups)||groups.length<1||groups.length>6)throw RangeError("Use 1–6 disjoint synthetic field groups");
 const ids=new Set();const normalized=groups.map(g=>{
 if(typeof g?.id!=="string"||!g.id.trim()||g.id.length>80||ids.has(g.id)||!Array.isArray(g.options)||g.options.length<1||g.options.length>5)throw Error("Invalid or duplicate group");ids.add(g.id);
 const options=new Set();return {id:g.id,choices:[{id:null,cost:0,low:0,expected:0,high:0},...g.options.map(o=>{
 if(typeof o?.id!=="string"||!o.id.trim()||o.id.length>80||options.has(o.id))throw Error("Invalid or duplicate option");options.add(o.id);
 const r=robust(o.input,spread);return {id:o.id,cost:Math.ceil(r.costUpperJpy),...r.range};
 })]};
 });
 const candidates=[];let evaluated=0;
 function walk(i,selected,cost,low,expected,high){
 if(cost>budget)return;
 if(i===normalized.length){evaluated++;candidates.push({selected:[...selected],cost,low,expected,high});return}
 const g=normalized[i];for(const o of g.choices)walk(i+1,[...selected,{group:g.id,option:o.id}],cost+o.cost,low+o.low,expected+o.expected,high+o.high);
 }
 walk(0,[],0,0,0,0);
 candidates.sort((a,b)=>a.cost-b.cost||b.low-a.low||b.expected-a.expected);
 let bestLow=-Infinity;const frontier=[];for(const c of candidates)if(c.low>bestLow){frontier.push(c);bestLow=c.low}
 const best=[...candidates].sort((a,b)=>b.low-a.low||a.cost-b.cost||b.expected-a.expected)[0];
 return {classification:"synthetic_portfolio_projection",budget,best,frontier,evaluated,verifiedTco2e:null,limitations:["Groups must represent disjoint land; not verified","One action per group; additive impacts assumed","Cost uses upper adoption bound and rounds up to yen","No long-term interactions or agronomic feasibility modeled"]};
}
export {robust,claim,optimize};
