function addRecord(records,record){
 if(!Array.isArray(records)||records.length>=24)throw Error("Maximum 24 evidence records");
 if(!["baseline_history","activity_log","field_context","supporting_observation"].includes(record?.kind))throw Error("Unknown evidence category");
 if(typeof record.sha256!=="string"||!/^[a-f0-9]{64}$/.test(record.sha256))throw Error("Invalid SHA-256");
 if(!Number.isInteger(record.bytes)||record.bytes<1||record.bytes>10*1024*1024)throw Error("File must be 1 byte–10 MiB");
 if(records.some(x=>x.sha256===record.sha256))throw Error("Duplicate content");
 return [...records,{kind:record.kind,sha256:record.sha256,bytes:record.bytes}];
}

function evidenceStatus(records,review,scope){
 const required=["baseline_history","activity_log","field_context"];
 const missing=required.filter(kind=>!records.some(x=>x.kind===kind));
 const complete=missing.length===0;
 const current=complete&&typeof scope==="string"&&/^[a-f0-9]{64}$/.test(scope)&&review?.scope===scope&&review?.decision==="reviewed"&&review?.reviewer==="local_self_review";
 return {status:current?"self_review_recorded":complete?"metadata_complete_review_pending":records.length?"evidence_partial":"no_evidence",missing,verifiedTco2e:null,certification:"not_certified",reviewCurrent:!!current};
}

function scopePayload(assumptions,records){
 return JSON.stringify({version:"greenshift-evidence-v1",assumptions,records:[...records].sort((a,b)=>a.sha256<b.sha256?-1:a.sha256>b.sha256?1:0)});
}
async function digest(bytes){
 if(!globalThis.crypto?.subtle)throw Error("Web Crypto requires HTTPS or localhost");
 const hash=await globalThis.crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,"0")).join("");
}
async function scopeHash(assumptions,records){return digest(new TextEncoder().encode(scopePayload(assumptions,records)))}
export {addRecord,evidenceStatus,scopePayload,digest,scopeHash};
