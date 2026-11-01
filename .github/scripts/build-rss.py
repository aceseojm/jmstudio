#!/usr/bin/env python3
"""Deep AI RSS 생성: deploy/deep-ai/index.html의 blogPost 목록 순서대로 deploy/deep-ai/rss.xml을 만든다.
publish-drafts.py가 자동으로 실행한다. 직접 실행: python3 .github/scripts/build-rss.py"""
import json, re, html
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from pathlib import Path

DEPLOY = Path(__file__).resolve().parents[2]
SITE = 'https://www.thejmstudio.co.kr'
BLOG = SITE + '/deep-ai/'
KST = timezone(timedelta(hours=9))

idx = (DEPLOY / 'deep-ai/index.html').read_text()
posts = None
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', idx, re.S):
    data = json.loads(block)
    for node in data.get('@graph', [data]):
        if 'blogPost' in node:
            posts = node['blogPost']
assert posts, 'blogPost 목록을 찾지 못했습니다'

def body(src):
    m = re.search(r'<div class="prose">\n(.*?)\n  </div>\n\n  <nav class="p-nav"', src, re.S)
    assert m, 'prose 영역을 찾지 못했습니다'
    s = m.group(1)
    s = re.sub(r'<nav class="toc".*?</nav>\s*', '', s, flags=re.S)
    s = re.sub(r'<aside class="p-cta">.*?</aside>\s*', '', s, flags=re.S)
    s = re.sub(r'(href|src)="/', r'\1="' + SITE + '/', s)
    s = re.sub(r'href="#', 'href="' + '{url}#', s)
    return s.strip()

items = []
for p in posts:
    url = p['url']
    src = (DEPLOY / url.replace(SITE + '/', '')).read_text()
    desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', src).group(1))
    d = datetime.strptime(p['datePublished'], '%Y-%m-%d').replace(hour=9, tzinfo=KST)
    content = body(src).replace('{url}', url)
    assert ']]>' not in content
    items.append(f"""  <item>
   <title>{html.escape(p['headline'])}</title>
   <link>{url}</link>
   <guid isPermaLink="true">{url}</guid>
   <pubDate>{format_datetime(d)}</pubDate>
   <description>{html.escape(desc)}</description>
   <content:encoded><![CDATA[{content}]]></content:encoded>
  </item>""")

latest = datetime.strptime(posts[0]['datePublished'], '%Y-%m-%d').replace(hour=9, tzinfo=KST)
rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
 <channel>
  <title>Deep AI — JM Studio</title>
  <link>{BLOG}</link>
  <atom:link href="{BLOG}rss.xml" rel="self" type="application/rss+xml" />
  <description>AI 에이전트, RAG, 워크플로 자동화, 검색 노출까지. 도입을 고민할 때 알아야 할 개념을 쉬운 말로 정리하는 JM Studio의 블로그입니다.</description>
  <language>ko</language>
  <lastBuildDate>{format_datetime(latest)}</lastBuildDate>
{chr(10).join(items)}
 </channel>
</rss>
"""
(DEPLOY / 'deep-ai/rss.xml').write_text(rss)
print(f'rss.xml: {len(items)}개 글, {len(rss.encode())//1024}KB')
