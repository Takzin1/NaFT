"""Independent Python oracle for the exact-arithmetic engine (fractions.Fraction).

The JavaScript engine evaluates the same deterministic synthetic cases through
scripts/evidence-intel-exact-replay.cjs. Nothing here is a GHG methodology, an
emission factor or a certified quantity.
"""
import json, math, subprocess, unittest
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODES = ('HALF_EVEN', 'HALF_UP', 'DOWN')


class Lcg:
    def __init__(self, seed):
        self.s = seed & 0xFFFFFFFF

    def next(self, n):
        self.s = (self.s * 1664525 + 1013904223) & 0xFFFFFFFF
        return (self.s >> 8) % n


def decimal_text(rng):
    whole, frac_digits = rng.next(2000), rng.next(5)
    if frac_digits == 0:
        return str(whole)
    return '%d.%0*d' % (whole, frac_digits, rng.next(10 ** frac_digits))


def terminates(x):
    d = x.denominator
    for p in (2, 5):
        while d % p == 0:
            d //= p
    return d == 1


def text(x):
    if not terminates(x):
        return '%d/%d' % (x.numerator, x.denominator)
    places = 0
    while (x * 10 ** places).denominator != 1:
        places += 1
    scaled = abs(x * 10 ** places).numerator
    digits = str(scaled)
    if places:
        digits = digits.rjust(places + 1, '0')
        digits = digits[:-places] + '.' + digits[-places:]
    return ('-' if x < 0 else '') + digits


def rounded(x, dp, mode):
    scale = 10 ** dp
    if mode == 'HALF_EVEN':
        return Fraction(round(x, dp))          # CPython rounds Fractions half-to-even exactly
    sign = -1 if x < 0 else 1
    if mode == 'DOWN':
        return Fraction(sign * math.floor(abs(x) * scale), scale)
    return Fraction(sign * math.floor(abs(x) * scale + Fraction(1, 2)), scale)  # HALF_UP, ties away from zero


def evaluate(e):
    if 'const' in e:
        return Fraction(e['const'])
    xs = [evaluate(a) for a in e['args']]
    op = e['op']
    if op == 'add':
        return sum(xs, Fraction(0))
    if op == 'mul':
        out = Fraction(1)
        for x in xs:
            out *= x
        return out
    if op == 'sub':
        return xs[0] - xs[1]
    if op == 'div':
        return xs[0] / xs[1]
    if op == 'min':
        return min(xs)
    if op == 'max':
        return max(xs)
    if op == 'round':
        return rounded(xs[0], e['dp'], e['mode'])
    raise AssertionError(op)


def cases():
    rng, out = Lcg(20261114), []
    for i in range(400):
        leaves = [{'const': decimal_text(rng)} for _ in range(2 + rng.next(4))]
        kind = ('mul', 'add', 'sub', 'div', 'min', 'max', 'mixed')[i % 7]
        if kind in ('sub', 'div'):
            if kind == 'div' and Fraction(leaves[1]['const']) == 0:
                leaves[1] = {'const': '3'}
            expr = {'op': kind, 'args': leaves[:2]}
        elif kind == 'mixed':
            expr = {'op': 'add', 'args': [{'op': 'mul', 'args': leaves[:2]}, {'op': 'div', 'args': [leaves[-1], {'const': '7'}]}]}
        else:
            expr = {'op': kind, 'args': leaves}
        if i % 3 != 0 or kind in ('div', 'mixed'):
            expr = {'op': 'round', 'dp': rng.next(9), 'mode': MODES[rng.next(3)], 'args': [expr]}
        out.append({'expr': expr})
    # Hand-picked ties and negatives
    for value, dp in (('0.125', 2), ('0.135', 2), ('2.5', 0), ('3.5', 0), ('0.5', 0), ('1.005', 2), ('0.000005', 5)):
        for mode in MODES:
            out.append({'expr': {'op': 'round', 'dp': dp, 'mode': mode, 'args': [{'const': value}]}})
            out.append({'expr': {'op': 'round', 'dp': dp, 'mode': mode, 'args': [{'op': 'sub', 'args': [{'const': '0'}, {'const': value}]}]}})
    return out


def replay(payload):
    done = subprocess.run(['node', 'scripts/evidence-intel-exact-replay.cjs'], input=json.dumps(payload), capture_output=True, text=True, cwd=ROOT, check=True)
    return json.loads(done.stdout)


class ExactArithmeticOracle(unittest.TestCase):
    def test_expressions_match_fraction_oracle(self):
        batch = cases()
        results = replay({'expressions': batch})['expressions']
        self.assertEqual(len(results), len(batch))
        self.assertGreater(len(batch), 400)
        ties = 0
        for case, got in zip(batch, results):
            want = evaluate(case['expr'])
            self.assertEqual(got['status'], 'OK', case)
            self.assertEqual(got['text'], text(want), case)
            self.assertEqual(got['terminating'], terminates(want), case)
            ties += case['expr']['op'] == 'round'
        self.assertGreater(ties, 100)

    def test_claim_previews_and_exact_aggregate(self):
        rng, rows = Lcg(77), []
        for i in range(60):
            area = '%d.%02d' % (rng.next(40), rng.next(100))
            rows.append({'id': 'PY-%02d' % i, 'area': float(area), 'area_text': area, 'days': 3 + rng.next(15)})
        for registry, factor in (('default', Fraction('2.5')), ('with-synthetic-correction', Fraction('2.4'))):
            out = replay({'claims': [{'id': r['id'], 'area': r['area'], 'days': r['days']} for r in rows], 'factor_registry': registry})
            total, counted = Fraction(0), 0
            for row, got in zip(rows, out['claims']):
                area = Fraction(row['area_text'])
                # Same decimal the engine sees: the shortest round-trip text of the JSON number.
                self.assertEqual(Fraction(repr(row['area'])), area)
                preview = rounded(area * row['days'] * factor * Fraction('0.001'), 6, 'HALF_EVEN')
                passes = row['days'] >= 7 and area > 0
                self.assertEqual(got['status'], 'AUTO_REEVALUATED' if passes else 'UNSUPPORTED', row)
                self.assertEqual(got['exact'], text(preview), row)
                self.assertIsNone(got['result'])
                self.assertEqual(got['factor'], ['SYN-EF@%s=%s' % ('2026.1' if registry == 'default' else '2026.2', text(factor))])
                if passes:
                    total += preview
                    counted += 1
            self.assertEqual(len(out['aggregates']), 1)
            aggregate = out['aggregates'][0]
            self.assertEqual(aggregate['preview_total'], text(total))
            self.assertEqual(aggregate['preview_claims'], counted)
            self.assertIsNone(aggregate['certified_total'])
            self.assertGreater(counted, 10)
            self.assertLess(counted, 60)


if __name__ == '__main__':
    unittest.main()
