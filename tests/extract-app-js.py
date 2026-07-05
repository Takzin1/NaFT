#!/usr/bin/env python3
"""naft-app.html から <script> ブロックを抽出し、tests/_app.js に結合出力する。
外部CDNスクリプト(qrcodejs)は対象外。node --check / smoke.test.js の前処理として使う。"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'naft-app.html').read_text(encoding='utf-8')
blocks = re.findall(r'<script>(.*?)</script>', html, re.S)
out = root / 'tests' / '_app.js'
out.write_text('\n;\n'.join(blocks), encoding='utf-8')
print(f'extracted {len(blocks)} script blocks -> {out}')
