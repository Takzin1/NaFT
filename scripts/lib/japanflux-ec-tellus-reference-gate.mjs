/* Tellus B 2012 calculation-option comparison: supplementary EC reference ONLY.
 * Its MSE rice paddy site is Mase 2005; NOT JP-Hrt 2013.
 * Experiments analyze H / H2O / CO2, NOT CH4.
 * No software version, settings, transfer coefficient or row QC attested.
 */
const deny=reason=>{throw Error(reason)};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const SOURCE_SHA='17f2cc3951d7d853d0ffe269f55dca5d469e4d3f755b761a74a50b2fb0cd5218';
const SITES=['BRW','UAF','TSE','TMK','MSE','FHK','PDF'];
const MEASURES=['SENSIBLE_HEAT_H','LATENT_HEAT_LE','CO2_FC'];
const STEPS=['DESPIKING','COORDINATE_ROTATION','CROSSWIND_AND_WATER_VAPOR_CORRECTION_FOR_SONIC_TEMPERATURE','BLOCK_AVERAGING_AND_OPTIONAL_DETREND','LAG_TIME_CORRECTION','COVARIANCE','HIGH_FREQUENCY_LOSS_CORRECTION','WPL_DENSITY_CORRECTION_IF_APPLICABLE','OPEN_PATH_SELF_HEATING_ONLY_IF_APPLICABLE'];
const ALTERNATIVES=['DOUBLE_ROTATION','PLANAR_FIT_ROTATION','EXTENDED_DOUBLE_ROTATION','TRIPLE_ROTATION','FIRST_OR_SECOND_ORDER_DETREND','OPEN_VS_CLOSED_PATH','WITHOUT_HIGH_FREQUENCY_LOSS_CORRECTION'];
const NOT_ATTESTED=['approved_for_jp_hrt_2013_ch4_settings','approved_for_jp_hrt_fch4_row_qc','approved_for_ch4_bias_factor','approved_for_ch4_gapfill','approved_for_japanflux_data_products'];
export function auditTellusEcOptionsReference(reference){
 const s=reference?.source,study=reference?.study,o=reference?.option_comparison,scope=reference?.scope_gate;
 if(reference?.schema!=='naft-ec-calculation-options-reference-v1'||
   s?.doi!=='10.3402/tellusb.v64i0.19048'||
   s?.pdf_sha256!==SOURCE_SHA||s?.pdf_size_bytes!==1632633||
   s?.pdf_pages!==26||s?.published_year!==2012||
   s?.year_in_user_filename!==2013||
   s?.source_license_display!=='CC_BY_NC_3_0'||
   s?.binary_pdf_redistributed!==false)
    deny('TELLUS_SOURCE_IDENTITY_OR_LICENSE_MISMATCH');
 if(!equal(study?.sites,SITES)||
   study?.rice_paddy_site_id!=='MSE'||
   study?.rice_paddy_site_name!=='Mase, Japan'||
   study?.rice_paddy_site_data_year!==2005||
   !equal(study?.compared_fluxes,MEASURES)||
   study?.ch4_experiment_data_present!==false||
   study?.jp_hrt_2013_in_study!==false||
   study?.raw_sampling_frequency_hz!==10||
   study?.flux_averaging_minutes!==30||
   study?.raw_to_half_hour_software!=='Flux Calculator'||
   study?.downstream_ustar_gapfill_partition_software!=='Flux Analysis Tool')
    deny('TELLUS_EXPERIMENT_SITE_OR_GAS_SCOPE_MISMATCH');
 if(o?.figure3_pdf_page!==7||o?.table2_pdf_page!==6||
   !equal(o?.steps_ordered,STEPS)||!equal(o?.alternatives,ALTERNATIVES)||
   o?.experiment_specific_controls_not_jp_hrt_settings!==true||
   o?.nominal_sensitivity_transfer_to_ch4_allowed!==false)
    deny('TELLUS_PROCESSING_OPTIONS_UNSUPPORTED_TRANSFER');
 if(scope?.source_type!=='METHODOLOGICAL_COMPARISON_ONLY'||
   scope?.application_to!=='EC_PROCESSING_OPTION_SENSITIVITY_REFERENCE'||
   NOT_ATTESTED.some(key=>scope?.[key]!==false)||
   scope?.confirmed_2013_flux_calculator_version!==null||
   scope?.confirmed_2013_processing_configuration!==null||
   scope?.independent_ch4_raw_waveforms_available!==false||
   scope?.published_ch4_fch4_reconstruction!==null||
   scope?.certified_tco2e!==null)
    deny('TELLUS_JP_HRT_CH4_SCIENTIFIC_PROMOTION_BLOCKED');
 return {
   schema:'naft-ec-method-comparison-scope-audit-v1',
   source_doi:s.doi,
   source_pdf_sha256:SOURCE_SHA,
   publication_year:2012,
   experiment_paddy_site:'MSE',
   experiment_year:2005,
   experimental_gases:['CO2','H2O'],
   ec_algorithm_option_comparison_available:true,
   historically_used_jp_hrt_2013_software_version_confirmed:false,
   actual_jp_hrt_2013_option_settings_confirmed:false,
   paper_directly_measured_jp_hrt_ch4:false,
   published_fch4_row_reconstruction_supported:false,
   approved_jp_hrt_ch4_numerical_bias_factor:null,
   observed_ch4_integral:null,
   certified_tco2e:null,
   status:'EC_OPTIONS_CONTEXT_ONLY_CH4_REPLAY_BLOCKED'
 };
}
