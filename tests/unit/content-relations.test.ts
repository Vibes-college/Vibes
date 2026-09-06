import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bilingualFixture } from '../fixtures/catalog.ts';
import { validateCatalog } from '../../src/lib/content/validate.ts';
import { relatedWorks } from '../../src/lib/content/relations.ts';
import { publishedWorks } from '../../src/lib/content/views.ts';
import { workFacts, validateFactAnchors } from '../../src/data/work-facts.ts';

test('a relation stored once is readable from both identities, even when titles are identical', () => {
  const c = bilingualFixture();
  c.works[0].meta.related = [{ targetId: 'work-1', reason: { zh: '适合对照阅读' } }];
  validateCatalog(c);
  assert.equal(relatedWorks(c, 'work-0', 'zh')[0].id, 'work-1');
  assert.deepEqual(relatedWorks(c, 'work-1', 'en')[0], {
    id: 'work-0',
    reason: '适合对照阅读',
    fallbackLocale: 'zh',
  });
  c.works[1].meta.related = [{ targetId: 'work-0', reason: { zh: '重复' } }];
  assert.throws(() => validateCatalog(c), /duplicate undirected/);
  c.works[1].meta.related = [];
  for (const targetId of ['work-0', 'missing']) {
    c.works[0].meta.related[0].targetId = targetId;
    assert.throws(() => validateCatalog(c), /self or missing/);
  }
});

test('facts retain order, support plain text and disclose fallback language instead of broken links', () => {
  const c = bilingualFixture();
  const source = c.works[0];
  source.meta.facts.unshift({
    key: 'prompt',
    kind: 'prompt',
    label: { zh: '提示词' },
    value: { zh: '<script>not HTML</script>' },
  });
  const view = publishedWorks(c, 'en')[0];
  const facts = workFacts(view, c);
  assert.equal(facts[0].label, '提示词');
  assert.equal(facts[0].href, undefined);
  assert.equal(facts[0].fallbackLocale, 'zh');
  assert.equal(facts[1].label, 'Creator');
  assert.equal(facts.at(-1)?.href, '/zh/works/work-0/#reading');
  source.meta.facts.push({
    key: 'anchor',
    kind: 'text',
    label: { zh: '正文' },
    value: { zh: '章节' },
    target: { kind: 'anchor', anchor: 'missing' },
  });
  assert.throws(
    () => validateFactAnchors(publishedWorks(c, 'zh')[0], '<h2 id="actual">Section</h2>'),
    /missing anchor/,
  );
});
