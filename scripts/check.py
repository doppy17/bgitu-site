#!/usr/bin/env python3
"""Проверка локальной копии: все относительные ссылки и ассеты должны указывать на существующие файлы."""
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
REF_RE = re.compile(r'(?:href|src|poster|data-src)\s*=\s*"([^"]*)"')
bad, ok, ext = [], 0, []

for html in ROOT.rglob("*.html"):
    text = html.read_text(encoding="utf-8", errors="replace")
    for ref in REF_RE.findall(text):
        if re.match(r'^(https?:|mailto:|tel:|javascript:|data:|//|#)', ref) or not ref:
            continue
        if ref.startswith("/"):
            ext.append((html.relative_to(ROOT), ref))
            continue
        target = (html.parent / unquote(ref.split("#")[0].split("?")[0])).resolve()
        if target.is_dir():
            target = target / "index.html"
        if target.exists():
            ok += 1
        else:
            bad.append((str(html.relative_to(ROOT)), ref))

print(f"OK ссылок: {ok}, битых: {len(bad)}, корневых абсолютных: {len(ext)}")
for f, r in bad[:25]:
    print(f"  БИТАЯ {f} -> {r}")
for f, r in ext[:15]:
    print(f"  АБС   {f} -> {r}")
