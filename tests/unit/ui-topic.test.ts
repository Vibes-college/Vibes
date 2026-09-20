import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  resources,
  groups,
  getGroup,
  buildTask,
  sourceWithLicense,
} from '../../src/features/ui-topic/catalog.ts';
import { renderDetail, renderGallery } from '../../src/features/ui-topic/render.ts';
import { escapeHtml } from '../../src/lib/escape.ts';
const root = new URL('../../', import.meta.url);
const file = (path: string) => readFileSync(new URL(path, root), 'utf8');
test('fifteen unique resources use inspected upstream sources', () => {
  assert.equal(resources.length, 15);
  assert.equal(new Set(resources.map((r) => r.id)).size, 15);
  for (const r of resources) {
    assert.equal(r.kind, 'upstream');
    assert.ok(['markmead/hyperui', 'argyleink/open-props'].includes(r.repo));
    assert.equal(r.license, 'MIT');
    assert.ok(r.source.includes(r.repo));
    assert.ok(r.source.endsWith(r.path));
  }
});
test('every source is pinned by Git blob and local excerpt digest', () => {
  for (const r of resources) {
    assert.match(r.upstreamBlobSha, /^[a-f0-9]{40}$/);
    assert.ok(r.blobUrl.endsWith(r.upstreamBlobSha));
    assert.equal(createHash('sha256').update(r.sourceText).digest('hex'), r.excerptSha256);
    assert.equal(file('public' + r.sourceFile), sourceWithLicense(r));
  }
});
test('copied sources retain correct attribution and complete MIT notice', () => {
  for (const r of resources) {
    assert.ok(r.licenseText.includes(r.repo.startsWith('markmead') ? 'Mark Mead' : 'Adam Argyle'));
    assert.ok(r.licenseText.includes('Permission is hereby granted'));
    assert.ok(r.licenseText.includes('THE SOFTWARE IS PROVIDED'));
    assert.equal(
      r.licenseText,
      file(
        'public/licenses/' + (r.repo.startsWith('markmead') ? 'hyperui' : 'open-props') + '.txt',
      ),
    );
  }
});
test('all declared previews, posters and recordings exist', () => {
  for (const r of resources)
    for (const key of ['previewSrc', 'image', 'video'] as const) {
      if (r[key])
        assert.ok(
          existsSync(new URL('public' + r[key] + (key === 'previewSrc' ? 'index.html' : ''), root)),
          r.id + ' ' + key,
        );
    }
});
test('preview HTML has no remote resource loads and denies network/forms', () => {
  for (const r of resources) {
    const html = file('public' + r.previewSrc + 'index.html');
    assert.ok(html.includes("connect-src 'none'"));
    assert.ok(html.includes("form-action 'none'"));
    assert.doesNotMatch(html, /<(?:img|script|link|iframe)[^>]+(?:src|href)=["']https?:/);
    assert.ok(html.includes('vibes-demo-ready'));
  }
});
test('all six selection groups are populated', () => {
  for (const g of groups) assert.ok(getGroup(g).length > 0);
});
test('templates are explicitly excerpted; motion uses upstream variables', () => {
  for (const r of getGroup('pages')) {
    assert.ok(r.scope.includes('节选'));
    assert.ok(renderDetail(r).includes('不是完整模板'));
  }
  for (const r of resources.filter(
    (r) => r.id.startsWith('props-') && !r.groups.includes('tokens'),
  )) {
    assert.ok(r.sourceText.includes('--animation-'));
    assert.equal(r.relatedSources[0].blobSha, 'f863c151d39c851e8d8ca315c92f33cd1826fdde');
  }
});
test('task refers to existing source rather than screenshot reimplementation', () => {
  const s = { id: 'props-bloom', borrow: ['动效'], target: '首页', changes: '慢一点' };
  const text = buildTask([s]);
  assert.ok(text.includes('不凭截图重写'));
  assert.ok(text.includes('首页'));
  assert.ok(text.includes('慢一点'));
  assert.ok(text.includes(resources.find((r) => r.id === s.id)!.upstreamBlobSha));
  assert.ok(text.includes('props.easing.js'));
});
test('unknown resource does not fabricate source or command', () => {
  assert.equal(buildTask([{ id: 'invented', borrow: [], target: '', changes: '' }]), '');
  assert.equal(buildTask([]), '');
});
test('source HTML is escaped and runtime previews have no same-origin permission', () => {
  assert.equal(escapeHtml('<script>&"'), '&lt;script&gt;&amp;&quot;');
  const html = renderDetail(resources[0]);
  assert.ok(html.includes('sandbox="allow-scripts"'));
  assert.ok(!html.includes('allow-same-origin'));
  assert.ok(html.includes('&lt;'));
});
test('MDX headings remain short and all actual sections are present', () => {
  const mdx = file('src/content/works/beui-motion-lab/zh.mdx');
  const headings = [...mdx.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(headings, ['开始', '灵感', '整页', '区块', '组件', '原语', '规范', '验证']);
  assert.doesNotMatch(mdx, /Vibes 原创示例|import .*beui/);
});
test('static resource view is readable without running third-party code', () => {
  const html = renderGallery('inspiration');
  assert.ok(html.includes('<img'));
  assert.ok(html.includes('href="https://github.com/'));
  assert.ok(!html.includes('<iframe'));
});
