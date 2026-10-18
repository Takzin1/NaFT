"""Independent Python Decimal verification of the Japan comparison contract.
Synthetic interval-mean data only; this is not independent publisher validation.
"""
from datetime import datetime,timezone
from decimal import Decimal as D
from pathlib import Path
from tempfile import TemporaryDirectory
import csv,hashlib,io,json,subprocess,unittest

ROOT=Path(__file__).resolve().parents[1]
CSV=ROOT/'research/japan-observation-adapters-2026-10-19/interval.csv'
META=ROOT/'research/japan-observation-adapters-2026-10-19/interval.manifest.json'
REF=ROOT/'research/japan-aggregate-reconciliation-2026-10-19/synthetic-interval-reference.json'
def independent(csv_bytes,meta,reference):
 assert hashlib.sha256(csv_bytes).hexdigest()==meta['csv_sha256']==reference['csv_sha256']
 assert meta['mass_basis']==reference['mass_basis']=='CH4_MOLECULAR'
 assert reference['data_class']==meta['data_class']
 assert reference['window_basis']=='EXPLICIT_OBSERVED_INTERVALS'
 assert reference['aggregate_unit']=='mg_CH4_m2'
 for key in ('site_id','plot_id','treatment','measurement_method','country','source_uri',
             'observation_start_utc','observation_end_utc'):
  assert reference[key]==meta[key]
 raw=csv_bytes.decode('utf8')
 reader=csv.DictReader(io.StringIO(raw))
 start=datetime.strptime(meta['observation_start_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
 end=datetime.strptime(meta['observation_end_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
 current=start
 total=D('0')
 for row in reader:
  begin=datetime.strptime(row['start_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
  stop=datetime.strptime(row['end_utc'],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
  assert begin==current and stop>begin and stop<=end
  assert row['qc_status'] in ('OBSERVED_GOOD','OBSERVED_ACCEPTABLE')
  seconds=D(str((stop-begin).total_seconds()))
  total+=D(row['value'])*seconds/D(86400)
  current=stop
 assert current==end
 claimed=D(reference['reported_cumulative_mg_ch4_m2'])
 tolerance=D(reference['printed_resolution_mg_ch4_m2'])
 delta=total-claimed
 return total,delta,abs(delta)*D(2)<=tolerance

def node_run(*args):
 return subprocess.run(['node','scripts/reconcile-japan-observation.mjs',*args],
   cwd=ROOT,capture_output=True,text=True,timeout=20)

class TestIndependentReconciliation(unittest.TestCase):
 def input(self):
  return CSV.read_bytes(),json.loads(META.read_text()),json.loads(REF.read_text())
 def test_synthetic_exact(self):
  raw,meta,ref=self.input()
  total,delta,within=independent(raw,meta,ref)
  process=node_run('synthetic-interval')
  self.assertEqual(process.returncode,0,process.stderr)
  result=json.loads(process.stdout)
  self.assertEqual(total,D('2.25'))
  self.assertEqual(total,D(result['replayed_mg_ch4_m2']))
  self.assertEqual(delta,D(result['replayed_minus_reported_mg_ch4_m2']))
  self.assertEqual(within,result['display_resolution_compatible'])
  self.assertFalse(result['rounding_cause_verified'])
  self.assertFalse(result['reference_content_independently_attested'])
  self.assertIsNone(result['certified_tco2e'])
 def test_user_supplied_declared_reference_and_signed_delta(self):
  raw,meta,ref=self.input()
  meta['data_class']=ref['data_class']='USER_SUPPLIED_UNVERIFIED'
  ref['reported_cumulative_mg_ch4_m2']='2.30'
  ref['printed_resolution_mg_ch4_m2']='0.1'
  with TemporaryDirectory(prefix='naft-reconciliation-') as path:
   root=Path(path)
   csv_path=root/'csv.csv';manifest_path=root/'manifest.json';reference_path=root/'reference.json'
   csv_path.write_bytes(raw)
   manifest_path.write_text(json.dumps(meta))
   reference_path.write_text(json.dumps(ref))
   process=node_run('--csv',str(csv_path),'--manifest',str(manifest_path),'--reference',str(reference_path))
   self.assertEqual(process.returncode,0,process.stderr)
   result=json.loads(process.stdout)
   total,delta,within=independent(raw,meta,ref)
   self.assertEqual(total,D(result['replayed_mg_ch4_m2']))
   self.assertEqual(delta,D('-0.05'))
   self.assertEqual(delta,D(result['replayed_minus_reported_mg_ch4_m2']))
   self.assertEqual(within,result['display_resolution_compatible'])
   self.assertIsNone(result['uncertainty_interval'])
 def test_not_matched_published_period(self):
  raw,meta,ref=self.input()
  ref['observation_start_utc']='2026-06-02T00:00:00Z'
  with self.assertRaises(AssertionError):independent(raw,meta,ref)
 def test_partial_observed_cannot_be_aggregated(self):
  raw= (ROOT/'research/japan-observation-adapters-2026-10-19/daily.csv').read_bytes()
  meta=json.loads((ROOT/'research/japan-observation-adapters-2026-10-19/daily.manifest.json').read_text())
  self.assertIn(b'MISSING',raw)
  self.assertNotEqual(raw,CSV.read_bytes())
  self.assertEqual(meta['observation_end_utc'],'2026-06-04T00:00:00Z')

if __name__=='__main__':unittest.main(verbosity=2)
