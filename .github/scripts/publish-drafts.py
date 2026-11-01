#!/usr/bin/env python3
"""Deep AI 예약 발행: _drafts/에서 발행일이 된 글을 deep-ai/로 옮기고 관련 파일을 갱신한다.

예약 글 한 편 = _drafts/<slug>.html (완성된 글 페이지) + _drafts/<slug>.json (발행 정보)
  {"date": "2026-11-01", "cat": "seo", "chip": "도입 가이드", "read": 9,
   "card": "목록 카드 설명", "llms": "llms.txt 설명"}
cat: chat(AI 챗봇·RAG) | auto(에이전트·자동화) | seo(검색 노출)

GitHub Actions가 매일 오전 9시(KST)에 실행한다. 직접 실행: python3 .github/scripts/publish-drafts.py [--today YYYY-MM-DD]
"""
import json, re, subprocess, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DRAFTS = ROOT / '_drafts'
SITE = 'https://www.thejmstudio.co.kr'
BLOG = SITE + '/deep-ai/'
CATS = {'chat': 'AI 챗봇·RAG', 'auto': '에이전트·자동화', 'seo': '검색 노출'}
CARD = '<a class="b-card reveal" data-cat="'


def rep(path, old, new):
    s = path.read_text()
    assert s.count(old) == 1, f'{path.name}: 바꿀 부분을 정확히 하나 찾지 못했습니다: {old[:60]}'
    path.write_text(s.replace(old, new))


def top_post(idx):
    m = re.search(r'"blogPost": \[\s*\{.*?"headline": "(.*?)",\s*"url": "(.*?)"', idx, re.S)
    return m.group(1), m.group(2).replace(BLOG, '')


def publish(slug, meta):
    page = (DRAFTS / f'{slug}.html').read_text()
    title = re.search(r'<h1>(.*?)</h1>', page).group(1)
    date = meta['date']
    index = ROOT / 'deep-ai/index.html'
    idx = index.read_text()
    prev_title, prev_file = top_post(idx)

    # 새 글: 이전 글 링크를 지금의 최신 글로
    page = re.sub(r'<nav class="p-nav" aria-label="글 이동">.*?</nav>',
                  f'<nav class="p-nav" aria-label="글 이동"><a href="/deep-ai/{prev_file}">← 이전 글: {prev_title}</a><a href="/deep-ai/">글 목록 →</a></nav>',
                  page, count=1, flags=re.S)
    (ROOT / f'deep-ai/{slug}.html').write_text(page)

    # 이전 최신 글: 다음 글 링크
    rep(ROOT / f'deep-ai/{prev_file}', '<a href="/deep-ai/">글 목록 →</a></nav>',
        f'<a href="/deep-ai/{slug}.html">다음 글: {title} →</a></nav>')

    # 글 목록: 구조화 데이터, 카드, 카드 등장 순서, 탭 숫자
    idx = idx.replace('   "blogPost": [\n', '   "blogPost": [\n    {\n     "@type": "BlogPosting",\n'
                      f'     "headline": {json.dumps(title, ensure_ascii=False)},\n     "url": "{BLOG}{slug}.html",\n'
                      f'     "datePublished": "{date}"\n    }},\n', 1)
    d = date.replace('-', '.')
    card = (f'{CARD}{meta["cat"]}" href="/deep-ai/{slug}.html">\n'
            f'      <div class="meta"><span class="topic">{CATS[meta["cat"]]}</span><span class="chip">{meta["chip"]}</span>'
            f'<time datetime="{date}">{d}</time><span>읽는 시간 {meta["read"]}분</span></div>\n'
            f'      <h2>{title}</h2>\n      <p>{meta["card"]}</p>\n      <span class="more grad">글 읽기 →</span>\n    </a>\n    ')
    i = idx.index(CARD)
    idx = idx[:i] + card + idx[i:]
    n = iter(range(10**6))
    idx = re.sub(r'(<a class="b-card reveal" data-cat="\w+")(?: data-d="\d")?',
                 lambda m: m.group(1) + {0: '', 1: ' data-d="1"'}.get(next(n), ' data-d="2"'), idx)
    cats = re.findall(r'<a class="b-card reveal" data-cat="(\w+)"', idx)
    idx = re.sub(r'(data-cat="all" aria-current="\w+">전체 <span>)\d+', lambda m: m.group(1) + str(len(cats)), idx)
    for k in CATS:
        idx = re.sub(rf'(<a href="#{k}" data-cat="{k}" aria-current="\w+">[^<]*<span>)\d+',
                     lambda m: m.group(1) + str(cats.count(k)), idx)
    index.write_text(idx)

    # sitemap, llms.txt
    rep(ROOT / 'sitemap.xml', '</urlset>', f'  <url>\n    <loc>{BLOG}{slug}.html</loc>\n    <lastmod>{date}</lastmod>\n'
        '    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>')
    llms = ROOT / 'llms.txt'
    lines = llms.read_text().split('\n')
    last = max(k for k, l in enumerate(lines) if l.startswith('- [') and f'{BLOG}' in l and '.html)' in l)
    lines.insert(last + 1, f'- [{title}]({BLOG}{slug}.html): {meta["llms"]}')
    llms.write_text('\n'.join(lines))

    (DRAFTS / f'{slug}.html').unlink()
    (DRAFTS / f'{slug}.json').unlink()
    print(f'발행: {date} {slug} ({title})', flush=True)


def main():
    today = datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d')
    if '--today' in sys.argv:
        today = sys.argv[sys.argv.index('--today') + 1]
    due = []
    for f in sorted(DRAFTS.glob('*.json')):
        meta = json.loads(f.read_text())
        assert meta['cat'] in CATS, f'{f.name}: cat 값이 올바르지 않습니다'
        assert (DRAFTS / f'{f.stem}.html').exists(), f'{f.stem}.html이 없습니다'
        if meta['date'] <= today:
            due.append((meta['date'], f.stem, meta))
    if not due:
        print(f'{today}: 발행할 글이 없습니다')
        return
    for _, slug, meta in sorted(due):
        publish(slug, meta)
    subprocess.run([sys.executable, str(Path(__file__).with_name('build-rss.py'))], check=True)


if __name__ == '__main__':
    main()
