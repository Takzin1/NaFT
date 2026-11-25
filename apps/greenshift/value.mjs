import {validate} from './engine.mjs';
import {robust,claim,optimize} from './decision.mjs';
function buildReport(groups,budget,spread){
 const portfolio=optimize(groups,budget,spread);
 const normalized=groups.map(g=>({id:g.id,options:g.options.map(o=>({id:o.id,input:validate(o.input)}))}));
 const base=normalized[0].options[0].input,r=robust(base,spread);
 return {schema:"greenshift-decision-v1",groups:normalized,spread:r.spread,robust:r,claim:claim(base,r.spread),portfolio};
}

function equal(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a),other=Object.keys(b);
 return keys.length===other.length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}

function replay(report){
 if(!report||report.schema!=="greenshift-decision-v1")throw Error("Unsupported decision report");
 const rebuilt=buildReport(report.groups,report.portfolio?.budget,report.spread);
 if(!equal(report,rebuilt))throw Error("Report differs from recomputation; results or schema were changed.");
 return rebuilt;
}

function valuation(report,prices,fx){
 const p=replay(report).portfolio.best;
 if(!prices||typeof prices!=="object")throw Error("Price assumptions required");
 const v={};for(const k of ["low","expected","high"]){const n=prices[k];if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>1e9)throw RangeError("Invalid price "+k);v[k]=n;}
 if(v.low>v.expected||v.expected>v.high)throw Error("Price range must be ordered");
 if(typeof fx!=="number"||!Number.isFinite(fx)||fx<1||fx>1e6)throw RangeError("Invalid illustrative JPY per USD");
 const corners=[p.low*v.low,p.low*v.high,p.high*v.low,p.high*v.high];
 const gross={low:Math.min(...corners),expected:p.expected*v.expected,high:Math.max(...corners)};
 const net=Object.fromEntries(Object.entries(gross).map(([k,n])=>[k,n-p.cost]));
 const breakEven={expected:p.expected>0?p.cost/p.expected:null,conservative:p.low>0?p.cost/p.low:null};
 return {schema:"greenshift-value-v1",classification:"illustrative_shadow_value_not_revenue",priceJpyPerTco2e:v,assumedJpyPerUsd:fx,portfolioCostUpperJpy:p.cost,netReductionTco2e:{low:p.low,expected:p.expected,high:p.high},grossShadowValueJpy:gross,netShadowValueAfterUpperCostJpy:net,netShadowValueUsdIllustrative:Object.fromEntries(Object.entries(net).map(([k,n])=>[k,n/fx])),breakEvenJpyPerTco2e:breakEven,verifiedTco2e:null,creditRevenueJpy:null,certified:false,limitations:["Hypothetical shadow prices, not market quotes or income","All net cases subtract the same upper cost; not cash flow or full profitability","No issued credits, tokens, settlement or exchange"]};
}
export {buildReport,equal,replay,valuation};
