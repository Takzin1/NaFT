import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {mkdtempSync as tmpMk} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {
 loadGovernanceRegistry
} from '../scripts/p2-method-soc-gate.mjs';
import {
 validateMethodSourceRequest,buildOfflineMethodIntake,
 verifyOfflineMethodIntake,renderOfflineMethodIntakeJa
} from '../scripts/p3-method-document-intake.mjs';

let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const denied=(fn,pattern)=>{assert.throws(fn,new RegExp(pattern));n++};
const clone=x=>structuredClone(x);
const reg=loadGovernanceRegistry();
const v33=JSON.parse(readFileSync('fixtures/p3-ag005-unverified-intake-request.json','utf8'));
const gold=JSON.parse(readFileSync('fixtures/p3-gold-soc-unverified-intake-request.json','utf8'));
// Synthetic minimum marker sample: deliberately NOT an institution's original PDF.
const synthetic=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /ResearchOnly >>\nendobj\n%%EOF\n');
const altered=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /DifferentSample >>\nendobj\n%%EOF\n');
eq(validateMethodSourceRequest(v33),true);
eq(validateMethodSourceRequest(gold),true);
const a=buildOfflineMethodIntake(v33,synthetic);
const b=buildOfflineMethodIntake(gold,synthetic);
eq(a.schema,'naft-p3-method-document-intake-receipt-v1');
eq(a.program,'J_CREDIT_AG005');
eq(a.candidate_version_label_unverified,'3.3');
eq(a.candidate_source_kind,'EGOV_PRIMARY_TEXT_REVIEWED_BYTES_NOT_PINNED');
eq(a.declared_url_kind,'REGISTERED_REFERENCE_URL_ONLY');
eq(a.research_digest_comparison,'NO_PREVIOUS_RESEARCH_RAW_PDF_SHA_AVAILABLE');
eq(a.pdf_marker_check,'HEADER_AND_TRAILER_ONLY_NOT_A_PDF_FORMAT_AUDIT');
eq(a.verified_checks.local_supplied_byte_integrity,true);
eq(a.verified_checks.matches_previous_research_snapshot,false);
eq(Object.values(a.verified_checks).filter(x=>x===true).length,1);
eq(a.external_pdf_republished,false);
eq(a.officially_certified_tco2e,null);
eq(a.formal_soc_loss_tco2e,null);
eq(a.final_credit_issuance,null);
eq(a.ledger_or_financial_action,false);
eq(a.independent_attestation_signature,null);
eq(a,buildOfflineMethodIntake(v33,synthetic));
eq(b.program,'GOLD_STANDARD_SOC');
eq(b.declared_url_kind,'PUBLISHER_INFORMATION_PAGE_NOT_VERIFIED_ORIGINAL_PDF');
eq(b.verified_checks.official_version_and_effective_date,false);
eq(b.verified_checks.scientific_or_vvb_approval,false);
eq(b.officially_certified_tco2e,null);
eq(verifyOfflineMethodIntake(v33,synthetic,a).status,
 'LOCAL_BYTES_RECHECKED_NOT_PUBLISHER_AUTHENTICATED');
eq(verifyOfflineMethodIntake(gold,synthetic,b).receipt_sha256,b.receipt_sha256);
const ja=renderOfflineMethodIntakeJa(a);
assert.match(ja,/原本ハッシュ照合は、出版社による真正性や現行採択版の確認ではありません/);n++;
assert.match(ja,/正式認証削減量：null/);n++;
assert.match(ja,new RegExp(a.raw_pdf_sha256));n++;
denied(()=>verifyOfflineMethodIntake(v33,altered,a),'SOURCE_RECEIPT_REPLAY_MISMATCH');
denied(()=>verifyOfflineMethodIntake(v33,synthetic,{...a,officially_certified_tco2e:100}),
 'SOURCE_RECEIPT_REPLAY_MISMATCH');
denied(()=>renderOfflineMethodIntakeJa({...a,final_credit_issuance:9}),'RECEIPT_INTEGRITY');
denied(()=>buildOfflineMethodIntake({...v33,candidate_version:'9.0'},synthetic),
 'UNKNOWN_JCREDIT_VERSION');
denied(()=>buildOfflineMethodIntake({...v33,candidate_version:'3.1'},synthetic),
 'JCREDIT_REFERENCE_URL_MISMATCH');
denied(()=>buildOfflineMethodIntake({...v33,candidate_version:'3.1',
 source_page_url:reg.jcredit.history[0].reference},synthetic),
 'CONFLICT_WITH_PREVIOUSLY_RECORDED_SOURCE_HASH');
denied(()=>buildOfflineMethodIntake({...v33,source_page_url:'https://evil.example/payload.pdf'},synthetic),
 'JCREDIT_REFERENCE_URL_MISMATCH');
denied(()=>buildOfflineMethodIntake({...gold,source_page_url:'https://evil.example/payload.pdf'},synthetic),
 'GOLD_REFERENCE_URL_MISMATCH');
denied(()=>buildOfflineMethodIntake({...gold,candidate_version:'1.0'},synthetic),
 'GOLD_OFFICIAL_VERSION_NOT_PINNED');
denied(()=>buildOfflineMethodIntake({...v33,declared_filename:'../escape.pdf'},synthetic),
 'UNSAFE_DECLARED_FILENAME');
denied(()=>buildOfflineMethodIntake({...v33,acquisition:'VERIFIED_PUBLISHER'},synthetic),
 'REQUEST_UNTRUSTED_ACQUISITION');
denied(()=>buildOfflineMethodIntake({...v33,officially_certified_tco2e:900},synthetic),
 'REQUEST_KEYS');
denied(()=>buildOfflineMethodIntake({...v33,extra:'injection'},synthetic),'REQUEST_KEYS');
denied(()=>buildOfflineMethodIntake(v33,Buffer.from('not a pdf')),'PDF_SIZE_LIMIT');
denied(()=>buildOfflineMethodIntake(v33,Buffer.from('MZ__file\n'.padEnd(60,'x')+'%%EOF\n')),
 'PDF_HEADER_MARKER');
denied(()=>buildOfflineMethodIntake(v33,Buffer.from('%PDF-1.7\n'.padEnd(60,'x'))),
 'PDF_EOF_MARKER');
denied(()=>buildOfflineMethodIntake(v33,Buffer.alloc(12*1024*1024+1)),
 'PDF_SIZE_LIMIT');
for(const ver of ['3.4','3.5']){
 const other={...v33,candidate_version:ver,source_page_url:null};
 const r=buildOfflineMethodIntake(other,synthetic);
 eq(r.candidate_version_label_unverified,ver);
 eq(r.declared_url_kind,'UNPINNED_DISCOVERY_ONLY');
 eq(r.verified_checks.independent_publisher_pdf_authentication,false);
 eq(r.officially_certified_tco2e,null);
}
const tamperedReg=clone(reg);
tamperedReg.jcredit.current_adoption_verified=true;
denied(()=>buildOfflineMethodIntake(v33,synthetic,tamperedReg),
 'JCREDIT_CURRENT_SOURCE_NOT_VERIFIED');
const cli=(...args)=>spawnSync(process.execPath,['scripts/p3-method-document-intake.mjs',...args],
 {encoding:'utf8',timeout:20000,maxBuffer:400000});
const root=mkdtempSync(join(tmpdir(),'naft-p3-document-intake-'));
try{
 const request=join(root,'request.json'),pdf=join(root,'synthetic.pdf'),
  receipt=join(root,'receipt.json'),invalid=join(root,'invalid.pdf');
 writeFileSync(request,JSON.stringify(v33));
 writeFileSync(pdf,synthetic);
 const generated=cli('generate',request,pdf);
 eq(generated.status,0);
 eq(JSON.parse(generated.stdout),a);
 writeFileSync(receipt,generated.stdout);
 const verified=cli('verify',request,pdf,receipt);
 eq(verified.status,0);
 eq(JSON.parse(verified.stdout).receipt_sha256,a.receipt_sha256);
 const md=cli('markdown',request,pdf);
 eq(md.status,0);
 eq(md.stdout,ja+'\n');
 writeFileSync(pdf,altered);
 const replay=cli('verify',request,pdf,receipt);
 eq(replay.status!==0,true);
 eq(replay.stderr.includes('SOURCE_RECEIPT_REPLAY_MISMATCH'),true);
 writeFileSync(invalid,Buffer.from('not pdf'));
 const bad=cli('generate',request,invalid);
 eq(bad.status!==0,true);
 writeFileSync(pdf,synthetic);
 const sym=join(root,'link.pdf');
 symlinkSync(pdf,sym);
 const symlink=cli('generate',request,sym);
 eq(symlink.status!==0,true);
 eq(symlink.stderr.includes('UNSAFE_LOCAL_FILE'),true);
}finally{rmSync(root,{recursive:true,force:true})}
console.log('NAFT_P3_METHOD_DOCUMENT_INTAKE_PASS: '+n+
 ' checks; synthetic bytes only, no publisher attestation or credits');
