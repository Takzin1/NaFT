"""Validate local documentation links and runtime script paths after domain removal."""
from pathlib import Path
import re
root = Path(__file__).resolve().parent.parent
for path in root.rglob('*.md'):
    if '.git' in path.parts:
        continue
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        if re.match(r'^[a-z]+:', target) or target.startswith('#'):
            continue
        target = target.split('#')[0]
        assert (path.parent / target).exists(), f'{path}: missing {target}'
html = (root / 'naft-app.html').read_text()
for target in re.findall(r'<script[^>]+src="([^"]+)"', html):
    assert not re.match(r'^[a-z]+:', target), f'external script: {target}'
    assert (root / target).is_file(), f'missing script: {target}'
print('local document and script references: OK')
