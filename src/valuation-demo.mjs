// Snapshot times are explicit. Callers choose live scenario time or a historical replay.
export function assumption(pair, value, at) {
  return {pair,source:'P80 synthetic scenario',source_kind:'SYNTHETIC',observed_at:at,as_of:at,
    expires_at:new Date(Date.parse(at) + 3600000).toISOString(),market_price:null,
    fixed_redemption_value:null,user_assumption:value,selected:'user_assumption',conflicting:false};
}
export function scenario(asset,at) {
  return {asset,valuation_scenario_id:'p80-demo',asset_symbol:'SIM-USD',fee_bps:'25',quantity_override:null,
    snapshot:{price:assumption('JPY/tCO2e','1500',at),fx:assumption('JPY/USD','150.25',at),
      peg:assumption('USD/SIM-USD','1',at)}};
}
