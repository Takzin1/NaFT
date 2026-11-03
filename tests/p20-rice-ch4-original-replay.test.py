#!/usr/bin/env python3
"""P20 CI tests: run on Python stdlib, without source ZIP or rasterio."""
import importlib.util
import pathlib
import tempfile
import unittest

p = pathlib.Path(__file__).resolve().parents[1] / 'scripts/p20-rice-ch4-original-replay.py'
spec = importlib.util.spec_from_file_location('p20_replay', p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class ReplayTests(unittest.TestCase):
    def test_source_identity(self):
        self.assertEqual(len(mod.SOURCE_SHA), 64)
        self.assertEqual(len(mod.PREVIEW_SHA), 64)
        self.assertEqual(len(mod.SOURCE_ENTRIES), 30)
        self.assertEqual((mod.YEAR_START, mod.YEAR_END), (2001, 2015))
    def test_base36_pack_overflow(self):
        self.assertEqual(mod.base36(0, 2), '00')
        self.assertEqual(mod.base36(35, 2), '0z')
        self.assertEqual(mod.base36(36, 2), '10')
        self.assertEqual(mod.base36(1247, 2), 'yn')
        with self.assertRaisesRegex(ValueError, 'PACK_RANGE'):
            mod.base36(1296, 2)
        with self.assertRaisesRegex(ValueError, 'PACK_RANGE'):
            mod.base36(-1, 2)
    def test_exact_tile_bounds(self):
        for length, count in [(2808, 48), (1516, 26)]:
            edges = [mod.bounds(i, length, count) for i in range(count + 1)]
            self.assertEqual(edges[0], 0)
            self.assertEqual(edges[-1], length)
            self.assertTrue(all(a < b for a, b in zip(edges, edges[1:])))
            self.assertEqual(sum(b - a for a, b in zip(edges, edges[1:])), length)
    def test_rounding(self):
        self.assertEqual(mod.round_positive(0), 0)
        self.assertEqual(mod.round_positive(1.24), 12)
    def test_mismatched_archive_fail_closed_without_raster_dependencies(self):
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / 'wrong.zip'
            f.write_bytes(b'PK\x03\x04 not the source')
            with self.assertRaisesRegex(ValueError, 'ZIP_SHA256_MISMATCH'):
                mod.replay(f, mod.REGISTRY)

if __name__ == '__main__':
    unittest.main()
