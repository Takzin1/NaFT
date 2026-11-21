"""Independent rational arithmetic oracle. Values are never parsed as binary floats."""
import json
import sys
from fractions import Fraction

def fmt(n):
    return ("%d.%06d" % divmod(n, 10**6)).rstrip("0").rstrip(".")

def quote(row):
    qty, price, rate, peg, symbol, bps = row
    principal = int(Fraction(qty) * Fraction(price))
    usd = Fraction(principal) / Fraction(rate)
    units = Fraction(principal) if symbol == "JPYC" else usd
    gross = int(units / Fraction(peg) * 10**6)
    fee = gross * int(bps) // 10000
    return [str(principal), fmt(int(usd * 10**6)), fmt(gross), fmt(fee), fmt(gross-fee)]

print(json.dumps([quote(row) for row in json.load(sys.stdin)]))
