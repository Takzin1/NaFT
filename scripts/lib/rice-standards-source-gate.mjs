/* Source-scoped rice MRV cross-program evidence gate.
 * Source-specific semantics only; never map unqualified Tier/QA numeric labels.
 * Gold Standard 2024 workbook/checklist conflict is preserved as evidence.
 * No clock, network, certified credits, monetary or registry operations.
 */
const fail=reason=>{throw Error(reason)};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const SHA={
 verra_vm0051_v11:'9b9738840824f5919e3a76f8807c68743ae3d64b5d931cda27598f3ab32c64e2',
 gold_scenarios:'77519262ddf83e00a3dd04f89be7cef46a79f534c50496f1c770325e5f1ef461',
 gold_calculation_tool:'92ddfcf926ec2eaead54e674c06a608f8a29b8e6ff0698a0468aa29152cd8040',
 gold_validation_checklist:'532ec2c31daf95d911367b2516a5e0c67d17ba47031457c89d9d55844217478a'
};
const VERRA={QA1:'BIOGEOCHEMICAL_MODEL',QA2:'CH4_DIRECT_CHAMBER_MEASUREMENT',QA3:'DEFAULT_EMISSION_FACTORS'};
const GOLD={Tier1:'SIMPLIFIED_DEFAULT_FACTORS',Tier2:'COUNTRY_SPECIFIC_FACTORS',Tier3:'DIRECT_MEASUREMENT'};
const VVB={Tier1:'DIRECT_MEASUREMENT',Tier2:'COUNTRY_SPECIFIC_FACTORS',Tier3:'DEFAULT_EMISSION_FACTORS'};
const KEYS=Object.keys(SHA);
export function auditRiceStandardsSources(manifest){
 if(!manifest||manifest.schema!=='naft-rice-standards-evidence-pack-v1'||
    manifest.status!=='SOURCE_INSPECTED_CALCULATION_REPLAY_NOT_ATTESTED'||
    !manifest.source_files||!eq(Object.keys(manifest.source_files).sort(),KEYS.sort())||
    KEYS.some(k=>manifest.source_files[k]?.sha256!==SHA[k])||
    manifest.cross_source_conclusions?.raw_binaries_redistributed!==false)
  fail('RICE_SOURCE_IDENTITY_OR_BYTES_MISMATCH');
 const v=manifest.source_files.verra_vm0051_v11;
 const gs=manifest.source_files.gold_scenarios;
 const wb=manifest.source_files.gold_calculation_tool;
 const chk=manifest.source_files.gold_validation_checklist;
 if(v.publisher!=='Verra'||v.document_id!=='VM0051'||v.version!=='1.1'||
    v.date!=='2026-07-14'||v.pages!==90||
    v.document_category!=='VCS_METHODOLOGY'||
    !eq(v.approaches,VERRA)||v.baseline_lookback_min_years!==3||
    v.baseline_fields_require_historical_schedule!==true||
    v.qa2_direct_field_chamber_required!==true||
    v.quantification_same_approach_for_baseline_and_project_same_source!==true||
    v.dmrv_appendix_page!==85||v.dmrv_requires_verifiable_evidence!==true||
    v.official_certification_claim!==false)
  fail('RICE_VERRA_VM0051_V11_METHOD_SCOPE');
 if(gs.publisher!=='Gold Standard'||gs.pages!==2||gs.scenario_count!==3||
    gs.document_category!=='TRAINING_EXERCISE'||!eq(gs.scenario_tier_labels,GOLD)||
    gs.scenario_1?.hectares_year1!==1000||gs.scenario_1?.hectares_from_year2!==4000||
    gs.scenario_2?.hectares!==12000||gs.scenario_2?.baseline_emission_factor_kg_ch4_ha_day!=='1.05'||
    gs.scenario_3?.hectares!==10000||
    gs.scenario_3?.baseline_integrated_kg_ch4_ha_year!==420||
    gs.scenario_3?.project_integrated_kg_ch4_ha_year!==95||
    gs.scenario_3?.uncertainty_deduction_percent!==10||
    gs.scenario_3?.nitrogen_increase!==false||
    gs.scenario_3?.diesel_l_ha!=='0.5')
  fail('RICE_GOLD_SCENARIO_DEFINITIONS');
 const expectedFormulas={
 'Tier 1_Simplified!E5':'=E9*E10*E14/1000*E15*(1-E30)',
 'Tier 2_Country specific!E4':'=(E8-E22)*(1-E60)',
 'Tier 3_Direct measurement!E4':'=(E8-E17)*(1-E49)',
 'ER!F9':"=IF(F8=\"Tier 1\",'Tier 1_Simplified'!E5,IF(F8=\"Tier 2\",'Tier 2_Country specific'!E4,'Tier 3_Direct measurement'!E4))"
 };
 if(wb.publisher!=='Gold Standard'||wb.methodology_version!=='1.0'||
    wb.workbook_version!=='1.1'||wb.document_category!=='WORKBOOK_CALCULATION_ORACLE'||
    !eq(wb.approaches,GOLD)||wb.gwp_ch4_ar5!==28||wb.gwp_n2o_ar5!==265||
    !eq(wb.sheets,['Instructions','Cover','Input_ER','Tier 1_Simplified','Tier 2_Country specific','Tier 3_Direct measurement','ER'])||
    !eq(wb.cell_references,expectedFormulas)||
    wb.original_workbook_republished!==false||
    wb.example_output_not_applicable_to_uploaded_scenario_inputs!==true)
  fail('RICE_GOLD_WORKBOOK_FORMULAS_OR_VERSION');
 if(chk.publisher!=='Gold Standard'||chk.version!=='1.0'||chk.publication_date!=='2024-04-05'||
    chk.document_category!=='VVB_VALIDATION_CHECKLIST'||!eq(chk.tier_labels_as_printed,VVB)||
    chk.checklist_method_tier_label_conflict_with_workbook!==true||
    chk.source_location!=='Section E, question 23 (rendered PDF p.16)'||
    !eq(chk.review_findings,['CL','CAR','FAR'])||
    chk.requires_exact_section_or_cell_evidence_reference!==true||
    chk.checklist_not_a_2026_verra_approval!==true)
  fail('RICE_GOLD_VVB_TIER_DISCREPANCY_NOT_PRESERVED');
 const cross=manifest.cross_source_conclusions;
 if(cross.global_tier_number_auto_mapping_allowed!==false||
    cross.gold_workbook_and_gold_vvb_tier_mappings_identical!==false||
    cross.verra_and_gold_rules_interchangeable!==false||
    cross.verra_vm0051_v11_is_gold_tool_methodology!==false||
    cross.japan_ag005_approval_from_these_sources!==false||
    cross.full_scenario_outputs_proven_reproduced!==false||
    cross.formal_credit_tco2e!==null||
    !eq(manifest.required_for_independent_oracle,[
     'EXPLICIT_STANDARD_AND_VERSION','EXPLICIT_APPROACH_SEMANTICS',
     'WORKBOOK_CASE_CELL_INPUT_BINDINGS','WORKBOOK_FORMULA_RECALCULATION_INDEPENDENTLY_VERIFIED',
     'ALL_GASES_AND_BASELINE_PROJECT_SCOPE_ALIGNED','VALIDATION_EVIDENCE_CHAIN']))
  fail('RICE_CROSS_PROGRAM_CLAIMS_OR_ORACLE_ATTESTATION');
 return Object.freeze({
  schema:'naft-rice-source-scope-audit-v1',
  status:'SOURCE_INSPECTED_NOT_INDEPENDENT_ORACLE_VERIFIED',
  source_hashes:Object.freeze({...SHA}),
  methods:Object.freeze({VERRA_VM0051_V1_1:{...VERRA},GOLD_AWD_WORKBOOK_V1_1:{...GOLD},
   GOLD_AWD_VALIDATION_CHECKLIST_V1_0:{...VVB}}),
  cross_document_tier_number_conflict:true,
  no_automatic_label_mapping:true,
  official_verification_granted:false,
  official_credit_tco2e:null
 });
}
export function resolveRiceApproach(manifest,{standard,version,source_kind,approach_label,semantic}={}){
 const scoped=auditRiceStandardsSources(manifest);
 if(typeof semantic!=='string'||!semantic.trim()||
    typeof standard!=='string'||typeof version!=='string'||
    typeof source_kind!=='string'||typeof approach_label!=='string')
  fail('RICE_APPROACH_NEEDS_FULL_SOURCE_AND_SEMANTICS');
 let allowed;
 if(standard==='Verra'&&version==='VM0051_v1.1'&&source_kind==='METHODOLOGY')allowed=scoped.methods.VERRA_VM0051_V1_1;
 else if(standard==='Gold Standard'&&version==='AWD_v1.0_WORKBOOK_v1.1'&&source_kind==='WORKBOOK')allowed=scoped.methods.GOLD_AWD_WORKBOOK_V1_1;
 else if(standard==='Gold Standard'&&version==='AWD_v1.0_CHECKLIST_v1.0'&&source_kind==='VVB_CHECKLIST')allowed=scoped.methods.GOLD_AWD_VALIDATION_CHECKLIST_V1_0;
 else fail('RICE_APPROACH_INSTITUTION_VERSION_UNSUPPORTED');
 if(!Object.prototype.hasOwnProperty.call(allowed,approach_label)||
     allowed[approach_label]!==semantic)
  fail('RICE_APPROACH_LABEL_SEMANTIC_CONFLICT');
 return Object.freeze({
  standard,version,source_kind,approach_label,semantic,
  scope:'DOCUMENT_SPECIFIC_CLASSIFICATION_ONLY',
  user_approval_required_for_formal_validation:true,
  independent_calculation_verified:false,
  full_emission_reduction_tco2e:null
 });
}
/* Narrow independent unit test of the CH4-only portion of the Gold Standard
 * Scenario 3 exercise. GWP=28 is an Excel input, not a Verra or current GWP
 * determination. No N2O, fossil fuel, baseline eligibility or full-credit claim.
 */
export function examineGoldScenario3MethaneSubterm(manifest){
 auditRiceStandardsSources(manifest);
 const a=manifest.source_files.gold_scenarios.scenario_3;
 const gwp=manifest.source_files.gold_calculation_tool.gwp_ch4_ar5;
 // All declared integers in the paper. Exact arithmetic, no floating point.
 const kgReduction=BigInt(a.baseline_integrated_kg_ch4_ha_year-a.project_integrated_kg_ch4_ha_year)*BigInt(a.hectares);
 const tCO2eCH4=kgReduction*BigInt(gwp)/1000n;
 const deducted=tCO2eCH4*BigInt(100-a.uncertainty_deduction_percent)/100n;
 return Object.freeze({
  status:'TRAINING_SCENARIO3_CH4_ONLY_SUBTERM_NOT_COMPLETE_ER',
  site_type:'HYPOTHETICAL_TRAINING',
  scenario:'GS_EXERCISE_3',
  area_hectares:a.hectares,
  methane_mass_delta_kg_per_year:kgReduction.toString(),
  workbook_gwp_ch4_ar5:gwp,
  illustrative_methane_component_tco2e_per_year:tCO2eCH4.toString(),
  illustrative_methane_component_after_10pct_deduction_tco2e_per_year:deducted.toString(),
  all_other_emission_sources_and_eligibility_verified:false,
  independent_workbook_scenario_replay_complete:false,
  final_certified_emission_reductions_tco2e:null
 });
}
