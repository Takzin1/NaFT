function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Scenario object required');
  const limits={areaHa:[0.01,100000],baselinePerHa:[0,1000],adoption:[0,1],reductionLow:[0,1],reductionExpected:[0,1],reductionHigh:[0,1],addedEmissionsPerHa:[0,1000],costPerHa:[0,100000000]};
  const clean={};
  for(const [key,[min,max]] of Object.entries(limits)){
    const v=input[key]; if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max) throw new RangeError('Invalid '+key);
    clean[key]=v;
  }
  if(clean.reductionLow>clean.reductionExpected||clean.reductionExpected>clean.reductionHigh) throw new RangeError('Reduction bounds must be ordered');
  return clean;
}

function simulate(input) {
  const p=validate(input), baseline=p.areaHa*p.baselinePerHa, treated=p.areaHa*p.adoption;
  const net=r=>treated*(p.baselinePerHa*r-p.addedEmissionsPerHa);
  const low=net(p.reductionLow),expected=net(p.reductionExpected),high=net(p.reductionHigh), cost=treated*p.costPerHa;
  return {modelVersion:'greenshift-scenario-v1',classification:'illustrative_projection',baselineTco2e:baseline,treatedHa:treated,projectedTco2e:baseline-expected,netReductionTco2e:{low,expected,high},costJpy:cost,costPerNetTonneJpy:expected>0?cost/expected:null,warning:low<=0?'Net benefit is not assured under the stated assumptions.':null,verifiedTco2e:null,assumptions:p};
}

function compare(options) {
  if(!Array.isArray(options)||options.length<1||options.length>50) throw new RangeError('Provide 1–50 options');
  const ids=new Set();
  return options.map(o=>{
    if(!o||typeof o.id!=='string'||!o.id.trim()||o.id.length>80||ids.has(o.id)) throw new TypeError('Unique scenario IDs required');
    ids.add(o.id);
    return {id:o.id,...simulate(o.input)};
  }).sort((a,b)=>b.netReductionTco2e.low-a.netReductionTco2e.low||b.netReductionTco2e.expected-a.netReductionTco2e.expected||a.costJpy-b.costJpy||a.id.localeCompare(b.id));
}
export {validate,simulate,compare};
