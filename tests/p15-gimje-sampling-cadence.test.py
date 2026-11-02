#!/usr/bin/env python3
"""No private original files are needed for CI; these test the P15 data guard."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('naft_p15',ROOT/'scripts/p15-gimje-sampling-cadence-qc.py')
p15=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p15)

def rows():
    return [
      {'DAT':str(i),'tavg':'22','course_type':'awd' if i%2 else 'flooding',
       'ch4_flux':v,'rain_mm':'0'} for i,v in enumerate(
        ['', '-0.12', 'NA', '0', '0.30'],start=1)
    ]

class SamplingCadenceTests(unittest.TestCase):
    def test_nonmeasurement_does_not_mean_zero(self):
        r=p15.analyze_field(rows(),2024,'md_14days+awd')
        self.assertEqual(r['daily_grid_rows'],5)
        self.assertEqual(r['observed_flux_rows'],3)
        self.assertEqual(r['unmeasured_daily_grid_rows'],2)
        self.assertEqual(r['negative_flux_values'],1)
        self.assertEqual(r['sampling_gap_histogram'],{'1':1,'2':1})
        self.assertEqual(r['max_sampling_gap_days'],2)
        self.assertEqual(r['weather_missing_or_invalid_rows'],0)
        self.assertEqual(sum(r['observed_water_stage_counts'].values()),3)
        self.assertEqual(sum(r['daily_water_stage_counts'].values()),5)

    def test_source_date_grid_must_be_exact(self):
        broken=rows();broken[2]['DAT']='4'
        with self.assertRaisesRegex(ValueError,'DAILY_GRID_NOT_CONSECUTIVE'):
            p15.analyze_field(broken,2024,'cf')

    def test_wrong_source_schema_and_stage_blocked(self):
        broken=rows();broken[2]['course_type']='AWD_UNVERIFIED'
        with self.assertRaisesRegex(ValueError,'UNKNOWN_DAILY_WATER_STAGE'):
            p15.analyze_field(broken,2024,'cf')
        with self.assertRaisesRegex(ValueError,'UNKNOWN_EXPERIMENT_TREATMENT'):
            p15.analyze_field(rows(),2024,'invented_CREDIT_APPROVED')
        broken=rows();broken[0]['extra']='x'
        with self.assertRaisesRegex(ValueError,'NATIVE_COLUMNS'):
            p15.analyze_field(broken,2024,'cf')

    def test_reject_nonfinite_flux_and_negative_rain(self):
        for val in ('NaN','Infinity','x'):
            broken=rows();broken[2]['ch4_flux']=val
            with self.assertRaises(ValueError):
                p15.analyze_field(broken,2024,'cf')
        broken=rows();broken[1]['rain_mm']='-1'
        with self.assertRaisesRegex(ValueError,'NEGATIVE_PRECIPITATION'):
            p15.analyze_field(broken,2024,'cf')

    def test_weather_missing_counts_but_does_not_make_flux_zero(self):
        broken=rows();broken[1]['tavg']='';broken[1]['rain_mm']=''
        r=p15.analyze_field(broken,2024,'cf')
        self.assertEqual(r['weather_missing_or_invalid_rows'],1)
        self.assertEqual(r['observed_flux_rows'],3)

    def test_structural_and_scientific_boundaries_aggregated(self):
        one=p15.analyze_field(rows(),2024,'md_14days+awd')
        a=p15.aggregate([one for i in range(60)],'zip-hash','xls-hash')
        self.assertEqual(a['field_count'],60)
        self.assertEqual(a['daily_grid_rows'],300)
        self.assertEqual(a['observed_flux_rows'],180)
        self.assertEqual(a['unmeasured_daily_grid_rows'],120)
        self.assertEqual(a['negative_flux_values'],60)
        self.assertEqual(a['sampling_gap_days_histogram'],{'1':60,'2':60})
        self.assertFalse(a['publisher_independent_measurement_qc_verified'])
        self.assertEqual(a['missing_flux_imputed'],0)
        self.assertEqual(a['negative_flux_removed'],0)
        self.assertIsNone(a['official_emissions_reductions_tco2e'])
        self.assertIsNone(a['issued_carbon_credits'])
        self.assertNotIn('field_id',json.dumps(a))
        with self.assertRaisesRegex(ValueError,'EXACTLY_60'):
            p15.aggregate([one], 'zip-hash','xls-hash')

    def test_actual_source_registered_arithmetic(self):
        p=json.loads((ROOT/'research/p15-gimje-sampling-cadence-2026-11-03.json').read_text())
        self.assertEqual(p['daily_grid_rows'],8391)
        self.assertEqual(p['observed_flux_rows'],1422)
        self.assertEqual(p['unmeasured_daily_grid_rows'],6969)
        self.assertEqual(p['negative_flux_values'],31)
        self.assertEqual(p['weather_missing_or_invalid_rows'],0)
        self.assertEqual(p['gaps_at_least_14_days'],27)
        self.assertEqual(p['maximum_sampling_gap_days'],16)
        self.assertEqual(sum(p['sample_counts_per_field'].values()),60)
        self.assertEqual(sum(int(k)*v for k,v in p['sample_counts_per_field'].items()),1422)
        self.assertEqual(sum(p['sampling_gap_days_histogram'].values()),1422-60)
        self.assertEqual(sum(v for k,v in p['sampling_gap_days_histogram'].items() if int(k)>=14),27)
        self.assertEqual(sum(p['observed_water_stage_counts'].values()),1422)
        self.assertEqual(sum(p['daily_water_stage_counts'].values()),8391)
        self.assertEqual(sum(r['observed_flux_rows'] for r in p['by_year']),1422)
        self.assertEqual(sum(r['observed_flux_rows'] for r in p['by_treatment']),1422)
        self.assertEqual([(r['year'],r['sample_counts_per_field']) for r in p['by_year']],
          [(2022,{'32':18}),(2023,{'22':15}),(2024,{'18':12,'20':15})])

    def test_private_per_field_report_is_exclusive_and_owner_only(self):
        with tempfile.TemporaryDirectory() as t:
            path=Path(t)/'private.json'
            data=[{'field_id':'TEST','unmeasured_daily_grid_rows':2}]
            p15.write_private(path,data)
            self.assertEqual(json.loads(path.read_text())['fields'],data)
            self.assertEqual(path.stat().st_mode & 0o777,0o600)
            with self.assertRaisesRegex(ValueError,'PRIVATE_REPORT_DESTINATION_EXISTS'):
                p15.write_private(path,data)

if __name__=='__main__':
    unittest.main()
