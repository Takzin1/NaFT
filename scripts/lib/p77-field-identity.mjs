/* NaFT P77 · research-only, local-first, immutable field identity and HITL lineage.
 * A MAFF polygon UUID is an annual observation, never a durable field_id.
 * No cadastral/ownership/credit/official-area claims. No raw geometry exported.
 */
import {createHash,randomUUID} from 'node:crypto';

export const SCHEMA='naft-p77-field-identity-v1';
const ZERO='0'.repeat(64);
const SHA=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FID=/^fld_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_EVIDENCE=new Set(['SOURCE_DOCUMENT','FIELD_PHOTO','FIELD_LOG','WATER_LEVEL','OTHER']);
const VALID_REASONS=new Set(['MANUAL_REVIEW','SAME_SHAPE_PREV_UUID','SPLIT_CANDIDATE','MERGE_CANDIDATE']);
function fail(code){throw new Error('P77_FIELD_IDENTITY_BLOCKED:'+code);}
function requireTrue(condition,code){if(!condition)fail(code);}
function digest(x){return createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');}
function dup(s){return JSON.parse(JSON.stringify(s));}
function sha(v){return typeof v==='string'&&SHA.test(v);}
function year(v){return Number.isSafeInteger(v)&&v>=2022&&v<=2100;}
function text(v,max=120){return typeof v==='string'&&v.trim().length>0&&v.length<=max;}
function field(s,id){return s.fields.find(f=>f.field_id===id);}
function observation(s,id){return s.observations.find(o=>o.observation_id===id);}
function candidate(s,id){return s.candidates.find(c=>c.candidate_id===id);}
function updated(s,event,data){
 const copy=dup(s);
 const previous=copy.events.at(-1)?.event_hash||ZERO;
 const e={seq:copy.events.length+1,event,body_sha256:digest(data),previous_hash:previous};
 e.event_hash=digest(e);
 copy.events.push(e);
 return copy;
}
export function newFieldId(){return 'fld_'+randomUUID();}
export function emptyFieldRegistry(){return {schema:SCHEMA,fields:[],observations:[],candidates:[],evidence:[],lineage:[],events:[],formal_certification:false,certified_tco2e:null};}
export function addField(state,{field_id,prefecture_code,reference_hash}){
 assertFieldRegistry(state);
 requireTrue(typeof field_id==='string'&&FID.test(field_id),'FIELD_ID_FORMAT');
 requireTrue(/^\d{2}$/.test(prefecture_code||'')&&Number(prefecture_code)>=1&&Number(prefecture_code)<=47,'PREFECTURE_CODE');
 requireTrue(sha(reference_hash),'FIELD_REFERENCE_HASH');
 requireTrue(!field(state,field_id),'DUPLICATE_FIELD_ID');
 let s=updated(state,'FIELD_CREATED',{field_id,prefecture_code,reference_hash});
 s.fields.push({field_id,prefecture_code,reference_hash,status:'RESEARCH_REFERENCE_ONLY'});
 return s;
}
export function stageObservation(state,input){
 assertFieldRegistry(state);
 const {polygon_uuid,issue_year,land_type,local_government_cd,source_file_sha256,geometry_sha256,last_polygon_uuid=null,history_sha256=null}=input;
 requireTrue(typeof polygon_uuid==='string'&&UUID.test(polygon_uuid),'POLYGON_UUID_V4');
 requireTrue(year(issue_year),'ISSUE_YEAR');
 requireTrue(land_type===100||land_type===200,'LAND_TYPE');
 requireTrue(typeof local_government_cd==='string'&&/^\d{6}$/.test(local_government_cd),'LOCAL_GOVERNMENT_CODE');
 requireTrue(sha(source_file_sha256)&&sha(geometry_sha256),'SOURCE_OR_GEOMETRY_SHA');
 requireTrue(last_polygon_uuid===null||UUID.test(last_polygon_uuid),'PREVIOUS_UUID');
 requireTrue(history_sha256===null||sha(history_sha256),'HISTORY_SHA');
 requireTrue(!state.observations.some(o=>o.polygon_uuid.toLowerCase()===polygon_uuid.toLowerCase()),'UUID_REUSED_ACROSS_YEARS');
 if(last_polygon_uuid!==null)requireTrue(last_polygon_uuid.toLowerCase()!==polygon_uuid.toLowerCase(),'SELF_PREVIOUS_UUID');
 const observation_id=digest('MAFF_FUDE|'+issue_year+'|'+polygon_uuid.toLowerCase());
 const data={observation_id,polygon_uuid:polygon_uuid.toLowerCase(),issue_year,land_type,local_government_cd,
  source_file_sha256,geometry_sha256,last_polygon_uuid:last_polygon_uuid?.toLowerCase()||null,history_sha256,
  approved_field_id:null,status:'UNREVIEWED_EXTERNAL_OBSERVATION'};
 let s=updated(state,'OBSERVATION_STAGED',data);s.observations.push(data);return s;
}
export function suggestContinuity(state,observation_id){
 assertFieldRegistry(state);const o=observation(state,observation_id);
 requireTrue(!!o,'UNKNOWN_OBSERVATION');
 if(!o.last_polygon_uuid)return [];
 return state.observations.filter(prev=>prev.polygon_uuid===o.last_polygon_uuid&&prev.issue_year===o.issue_year-1&&prev.approved_field_id)
 .map(prev=>({field_id:prev.approved_field_id,observation_id,reason:'SAME_SHAPE_PREV_UUID',status:'CANDIDATE_REQUIRES_HUMAN_REVIEW'}));
}
export function proposeLink(state,{field_id,observation_id,reason,proposal_basis_sha256}){
 assertFieldRegistry(state);
 const f=field(state,field_id),o=observation(state,observation_id);
 requireTrue(!!f&&!!o,'UNKNOWN_FIELD_OR_OBSERVATION');
 requireTrue(VALID_REASONS.has(reason),'LINK_REASON');
 requireTrue(sha(proposal_basis_sha256),'PROPOSAL_EVIDENCE_SHA');
 requireTrue(o.approved_field_id===null,'OBSERVATION_ALREADY_APPROVED');
 requireTrue(!state.candidates.some(c=>c.field_id===field_id&&c.observation_id===observation_id),'DUPLICATE_CANDIDATE');
 if(reason==='SAME_SHAPE_PREV_UUID')requireTrue(suggestContinuity(state,observation_id).some(c=>c.field_id===field_id),'PREVIOUS_UUID_NOT_ATTESTED');
 const candidate_id=digest('P77_CANDIDATE|'+field_id+'|'+observation_id);
 const data={candidate_id,field_id,observation_id,reason,proposal_basis_sha256,status:'PENDING_HUMAN_REVIEW',review:null};
 let s=updated(state,'LINK_PROPOSED',data);s.candidates.push(data);return s;
}
export function reviewLink(state,{candidate_id,decision,reviewer_reference_hash,decision_evidence_sha256,reason}){
 assertFieldRegistry(state);
 const c=candidate(state,candidate_id);
 requireTrue(!!c&&c.status==='PENDING_HUMAN_REVIEW','CANDIDATE_NOT_PENDING');
 requireTrue(decision==='APPROVE'||decision==='REJECT','REVIEW_DECISION');
 requireTrue(sha(reviewer_reference_hash)&&sha(decision_evidence_sha256)&&text(reason,500)&&reason.trim().length>=10,'REVIEW_EVIDENCE_REQUIRED');
 const o=observation(state,c.observation_id);
 if(decision==='APPROVE'){
  requireTrue(o.approved_field_id===null,'OBSERVATION_ALREADY_LINKED');
  requireTrue(!state.observations.some(v=>v.issue_year===o.issue_year&&v.approved_field_id===c.field_id),'FIELD_YEAR_ALREADY_LINKED_REVIEW_SPLIT_OR_MERGE');
  requireTrue(c.reason!=='SPLIT_CANDIDATE'&&c.reason!=='MERGE_CANDIDATE','LINEAGE_DECISION_REQUIRED');
 }
 const data={candidate_id,decision,reviewer_reference_hash,decision_evidence_sha256,reason};
 let s=updated(state,'HUMAN_LINK_REVIEW',data);
 const target=candidate(s,candidate_id);
 target.status=decision==='APPROVE'?'APPROVED_RESEARCH_LINK':'REJECTED';
 target.review={decision,reviewer_reference_hash,decision_evidence_sha256,reason};
 if(decision==='APPROVE')observation(s,c.observation_id).approved_field_id=c.field_id;
 return s;
}
export function attestLineage(state,{kind,source_field_ids,target_field_ids,reviewer_reference_hash,evidence_sha256,reason}){
 assertFieldRegistry(state);
 requireTrue(kind==='SPLIT'||kind==='MERGE','LINEAGE_KIND');
 requireTrue(Array.isArray(source_field_ids)&&Array.isArray(target_field_ids),'LINEAGE_FIELDS');
 requireTrue(kind==='SPLIT'?source_field_ids.length===1&&target_field_ids.length>=2:source_field_ids.length>=2&&target_field_ids.length===1,'LINEAGE_ARITY');
 requireTrue(new Set(source_field_ids).size===source_field_ids.length&&new Set(target_field_ids).size===target_field_ids.length,'DUPLICATE_LINEAGE_ENDPOINT');
 requireTrue(source_field_ids.every(id=>field(state,id))&&target_field_ids.every(id=>field(state,id)),'UNKNOWN_LINEAGE_FIELD');
 requireTrue(!source_field_ids.some(id=>target_field_ids.includes(id)),'SELF_LINEAGE');
 requireTrue(sha(reviewer_reference_hash)&&sha(evidence_sha256)&&text(reason,500)&&reason.trim().length>=10,'LINEAGE_HITL_REQUIRED');
 const links=source_field_ids.flatMap(from=>target_field_ids.map(to=>({from,to,kind})));
 const adjacency=new Map();
 for(const l of [...state.lineage,...links]){if(!adjacency.has(l.from))adjacency.set(l.from,new Set());adjacency.get(l.from).add(l.to);}
 const visit=(id,seen)=>{if(seen.has(id))return false;const next=new Set(seen);next.add(id);for(const child of adjacency.get(id)||[])if(!visit(child,next))return false;return true;};
 requireTrue([...adjacency.keys()].every(id=>visit(id,new Set())),'LINEAGE_CYCLE');
 const data={kind,source_field_ids,target_field_ids,reviewer_reference_hash,evidence_sha256,reason};
 let s=updated(state,'HUMAN_LINEAGE_ATTESTED',data);
 s.lineage.push(...links.map(l=>({...l,evidence_sha256,reviewer_reference_hash,status:'HUMAN_ATTESTED_LINEAGE_NOT_CADASTRAL'})));
 return s;
}
export function addFieldEvidence(state,{evidence_id,field_id,evidence_sha256,evidence_kind,activity_year,source_sha256}){
 assertFieldRegistry(state);
 requireTrue(text(evidence_id,100)&&!state.evidence.some(e=>e.evidence_id===evidence_id),'EVIDENCE_ID');
 requireTrue(!!field(state,field_id),'UNKNOWN_FIELD');
 requireTrue(sha(evidence_sha256)&&sha(source_sha256),'EVIDENCE_HASH');
 requireTrue(VALID_EVIDENCE.has(evidence_kind)&&year(activity_year),'EVIDENCE_KIND_OR_YEAR');
 const data={evidence_id,field_id,evidence_sha256,evidence_kind,activity_year,source_sha256,status:'RECORDED_NOT_VERIFIED'};
 let s=updated(state,'FIELD_EVIDENCE_ADDED',data);
 s.evidence.push(data);return s;
}
export function assertFieldRegistry(state){
 requireTrue(state?.schema===SCHEMA&&Array.isArray(state.fields)&&Array.isArray(state.observations)&&Array.isArray(state.candidates)&&Array.isArray(state.evidence)&&Array.isArray(state.lineage)&&Array.isArray(state.events),'SCHEMA');
 requireTrue(state.formal_certification===false&&state.certified_tco2e===null,'FALSE_CERTIFICATION_CLAIM');
 let prev=ZERO;
 for(let i=0;i<state.events.length;i++){
  const e=state.events[i];requireTrue(e.seq===i+1&&e.previous_hash===prev&&sha(e.body_sha256)&&sha(e.event_hash),'AUDIT_EVENT_CHAIN');
  const without={seq:e.seq,event:e.event,body_sha256:e.body_sha256,previous_hash:e.previous_hash};
  requireTrue(digest(without)===e.event_hash,'AUDIT_EVENT_TAMPER');prev=e.event_hash;
 }
 requireTrue(new Set(state.fields.map(f=>f.field_id)).size===state.fields.length,'FIELD_DUPLICATES');
 requireTrue(new Set(state.observations.map(o=>o.polygon_uuid)).size===state.observations.length,'POLYGON_UUID_DUPLICATES');
 requireTrue(new Set(state.evidence.map(e=>e.evidence_id)).size===state.evidence.length,'EVIDENCE_DUPLICATES');
 const linked=new Set();
 for(const o of state.observations)if(o.approved_field_id){
  requireTrue(!!field(state,o.approved_field_id),'BROKEN_OBSERVATION_LINK');
  const k=o.approved_field_id+'|'+o.issue_year;requireTrue(!linked.has(k),'FIELD_YEAR_DUPLICATE');linked.add(k);
  requireTrue(state.candidates.some(c=>c.observation_id===o.observation_id&&c.field_id===o.approved_field_id&&c.status==='APPROVED_RESEARCH_LINK'),'NO_HUMAN_LINK_DECISION');
 }
 return state;
}
export function buildPublicReceipt(state){
 assertFieldRegistry(state);
 return {schema:'naft-p77-public-field-lineage-receipt-v1',audit_head_sha256:state.events.at(-1)?.event_hash||ZERO,
  counts:{fields:state.fields.length,annual_observations:state.observations.length,links_approved:state.candidates.filter(c=>c.status==='APPROVED_RESEARCH_LINK').length,
   review_pending:state.candidates.filter(c=>c.status==='PENDING_HUMAN_REVIEW').length,lineage_edges:state.lineage.length,evidence_records:state.evidence.length},
  original_geometry_disclosed:false,field_reference_disclosed:false,formal_certification:false,certified_tco2e:null};
}
