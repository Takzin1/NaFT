"""Offline tests for ephemeral original-byte CSV metadata inspection."""
import importlib.util,unittest,hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('naft_source_harvest',ROOT/'scripts/harvest-asia-source-index.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TestSourceByteShape(unittest.TestCase):
 def test_ascii_daily_columns(self):
  raw=b'Year,DOY,Month,day,CH4-gC/m2/day\n2023,1,1,1,0.01\n2023,2,1,2,0.02\n'
  out=module.inspect_csv_byte_shape(raw)
  self.assertEqual(out['header_count'],5)
  self.assertEqual(out['data_row_count'],2)
  self.assertEqual(out['sample_400_row_column_counts'],{'5':2})
  self.assertEqual(out['non_ascii_header_field_indexes'],[])
  self.assertTrue(out['header_utf8_decodable'])
  self.assertEqual(out['header_raw_sha256'],hashlib.sha256(raw.split(b'\n',1)[0]).hexdigest())
  self.assertNotIn('0.01',str(out))
  self.assertFalse(out['byte_order_mark_utf8'])
 def test_original_legacy_charset_does_not_hide_bytes(self):
  raw=b'Year,Ta-\xb0C,CH4-gC/m2/day\r\n2023,22,0.012\r\n'
  out=module.inspect_csv_byte_shape(raw)
  self.assertEqual(out['header_count'],3)
  self.assertEqual(out['header_fields_ascii_or_hex'][1],'NON_ASCII_HEX:54612db043')
  self.assertEqual(out['non_ascii_header_field_indexes'],[1])
  self.assertFalse(out['header_utf8_decodable'])
  self.assertEqual(out['crlf_line_endings'],2)
  self.assertNotIn('0.012',str(out))
 def test_shape_observation_not_data_qc(self):
  raw=b'A,B\n1,2\n1,2,3\n'
  out=module.inspect_csv_byte_shape(raw)
  self.assertEqual(out['sample_400_row_column_counts'],{'2':1,'3':1})
  self.assertEqual(out['data_row_count'],2)
  self.assertNotIn('measurement_qc_verified',out)
 def test_original_harvester_offline_contract_preserved(self):
  import json
  index=json.loads((ROOT/'research/asia-source-dock-2026-10-19/source-index.json').read_text())
  self.assertIs(module.validate_index(index),index)
  self.assertEqual(len(module.select(index)),6)

if __name__=='__main__':unittest.main(verbosity=2)
