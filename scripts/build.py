#!/usr/bin/env python3
"""Статический экспорт публичного сайта БГИТУ из запущенного Django для GitHub Pages.

Обходит внутренние ссылки от "/", сохраняет каждую страницу как <path>/index.html,
переписывает корневые абсолютные ссылки (/static/..., /news/) в относительные,
чтобы всё работало в подкаталоге https://<user>.github.io/<repo>/.
"""
from __future__ import annotations

import posixpath
import re
import sys
import urllib.error
import urllib.request
from collections import deque
from pathlib import Path

BASE = "http://127.0.0.1:8010"
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/daniil/.hermes/cache/scratch/bgitu-static/site")

SKIP_PREFIXES = ("/admin/", "/admin", "/media/", "/staticfiles/", "/accounts/", "/api/", "/theme/", "/search/")
STUBS = {
    "/cabinet/": ("Личный кабинет", "Личный кабинет — серверная часть. В статичной копии она недоступна: "
                                   "кабинет, роли и оценки живут в Django-приложении с базой данных."),
    "/cabinet": ("Личный кабинет", "Личный кабинет — серверная часть. В статичной копии она недоступна."),
    "/roles/": ("Роли", "Заявки на роли обрабатывает серверная часть — в статичной копии недоступно."),
    "/roles": ("Роли", "Заявки на роли обрабатывает серверная часть — в статичной копии недоступно."),
}

REF_RE = re.compile(r'(?P<attr>\b(?:href|src|action|poster|data-src)\s*=\s*)(?P<q>["\'])(?P<url>/(?!/)[^"\']*)(?P=q)')
CSS_URL_RE = re.compile(r'url\(\s*(["\']?)(/(?!/)[^)"\']*)\1\s*\)')


def fetch(path: str) -> tuple[bytes, str]:
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "bgitu-static-export"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), r.headers.get("Content-Type", "")


def url_to_file(url_path: str) -> Path:
    """'/news/' -> news/index.html, '/' -> index.html, '/inst-it/' -> inst-it/index.html"""
    path = url_path.split("#")[0].split("?")[0]
    clean = path.strip("/")
    if not clean:
        return OUT / "index.html"
    if "." in clean.rsplit("/", 1)[-1]:
        return OUT / clean
    return OUT / clean / "index.html"


def depth_of(url_path: str) -> int:
    clean = url_path.strip("/")
    return 0 if not clean else len(clean.split("/"))


def relativize(url: str, depth: int) -> str:
    if url.startswith("//"):
        return url
    prefix = "./" if depth == 0 else "../" * depth
    target = url.lstrip("/")
    if url.endswith("/") and target:
        return prefix + target
    return prefix + target


def rewrite_html(html: str, page_path: str) -> str:
    depth = depth_of(page_path)

    def sub(m: re.Match) -> str:
        url = m.group("url")
        if url.startswith("/#") or url.endswith((".map",)):
            return m.group(0)
        new = relativize(url, depth)
        # чистые анкоры "/" -> "./"
        if url == "/" and depth == 0:
            new = "./"
        return f"{m.group('attr')}{m.group('q')}{new}{m.group('q')}"

    out = REF_RE.sub(sub, html)
    # инлайн-индекс поиска: {"url":"/admission/"} тоже должен стать относительным
    def sub_json(m: re.Match) -> str:
        return f'"url":"{relativize(m.group(1), depth)}"'

    out = re.sub(r'"url"\s*:\s*"(/[^"\\]*)"', sub_json, out)
    return out


def rewrite_css(css: str, css_path: str) -> str:
    depth = depth_of(css_path)

    def sub(m: re.Match) -> str:
        url = m.group(2)
        return f"url({m.group(1)}{relativize(url, depth)}{m.group(1)})"

    return CSS_URL_RE.sub(sub, css)


def normalize_href(href: str) -> str | None:
    """Внутренняя ссылка -> путь на сайте, иначе None."""
    if not href:
        return None
    if re.match(r'^(https?:|mailto:|tel:|javascript:|data:|#|//)', href):
        return None
    if not href.startswith("/"):
        return None
    path = href.split("#")[0].split("?")[0]
    if not path:
        path = "/"
    if any(path.startswith(p) or path == p.rstrip("/") for p in SKIP_PREFIXES):
        return None
    return path


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    queue: deque[str] = deque(["/"])
    seen: set[str] = set()
    pages = 0
    assets: set[str] = set()

    while queue:
        path = queue.popleft()
        if path in seen:
            continue
        seen.add(path)
        try:
            body, ctype = fetch(path)
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 403, 404):
                print(f"  skip {path} ({e.code})")
                continue
            raise
        target = url_to_file(path)
        if "html" in ctype:
            html = body.decode("utf-8", "replace")
            for m in REF_RE.finditer(html):
                href = m.group("url")
                if href.startswith("/static/"):
                    assets.add(href)
                else:
                    norm = normalize_href(href)
                    if norm and norm not in seen:
                        queue.append(norm)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(rewrite_html(html, path), encoding="utf-8")
            pages += 1
            print(f"  page {path} -> {target.relative_to(OUT)}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)

    # Статика: качаем найденные ассеты, CSS разбираем на url(...)
    pending = list(assets)
    done: set[str] = set()
    while pending:
        a = pending.pop()
        if a in done:
            continue
        done.add(a)
        try:
            body, ctype = fetch(a)
        except urllib.error.HTTPError as e:
            print(f"  asset skip {a} ({e.code})")
            continue
        tgt = url_to_file(a)
        tgt.parent.mkdir(parents=True, exist_ok=True)
        if a.endswith(".css"):
            tgt.write_text(rewrite_css(body.decode("utf-8", "replace"), a), encoding="utf-8")
            for m in CSS_URL_RE.finditer(body.decode("utf-8", "replace")):
                sub_url = m.group(2)
                if sub_url.startswith("/") and sub_url not in done:
                    pending.append(sub_url)
        else:
            tgt.write_bytes(body)

    # Заглушки вместо серверных страниц
    for stub_path, (title, text) in STUBS.items():
        tgt = url_to_file(stub_path)
        tgt.parent.mkdir(parents=True, exist_ok=True)
        depth = depth_of(stub_path)
        home = relativize("/", depth)
        css = relativize("/static/site/css/site.css", depth)
        tgt.write_text(f"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — БГИТУ (статичная копия)</title>
<link rel="stylesheet" href="{css}">
</head><body>
<main style="max-width:46rem;margin:12vh auto;padding:0 1.5rem;font:16px/1.6 system-ui,sans-serif">
<h1 style="font-size:1.6rem;margin:0 0 1rem">{title}</h1>
<p style="margin:0 0 1.5rem">{text}</p>
<p><a href="{home}">← на главную сайта</a></p>
</main></body></html>
""", encoding="utf-8")

    # Фильтр поискового индекса: оставляем только страницы, которые реально есть
    # в статичной копии (кабинетные маршруты /cabinet/* живут только на сервере).
    import json as _json
    dropped = 0
    for html_file in OUT.rglob("*.html"):
        text = html_file.read_text(encoding="utf-8")
        m = re.search(r'(id="bgitu-index"[^>]*>)(.*?)(</script>)', text, re.S)
        if not m:
            continue
        try:
            items = _json.loads(m.group(2))
        except Exception:
            continue
        keep = []
        for it in items:
            target = (html_file.parent / it.get("url", "").split("#")[0]).resolve()
            if target.is_dir():
                target = target / "index.html"
            if target.exists():
                keep.append(it)
            else:
                dropped += 1
        text = text[:m.start(2)] + _json.dumps(keep, ensure_ascii=False, separators=(",", ":")) + text[m.end(2):]
        html_file.write_text(text, encoding="utf-8")
    print(f"Поисковый индекс: убрано битых записей (кабинет) — {dropped}")

    # пустой service worker, чтобы не было 404
    (OUT / "sw.js").write_text(
        "/* статичная копия: кеширование отключено */\n"
        "self.addEventListener('install', function (e) { self.skipWaiting(); });\n"
        "self.addEventListener('activate', function (e) { self.clients.claim(); });\n",
        encoding="utf-8",
    )
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    print(f"\nИтого страниц: {pages}, файлов статики: {len(done)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
