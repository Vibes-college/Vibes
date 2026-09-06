import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sourceRevision, needsReview } from '../../src/lib/content/revision.ts';
import { bilingualFixture } from '../fixtures/catalog.ts';

test('source understanding changes stale every published translation; rereview clears the notice', () => {
  for (const change of [
    'body',
    'title',
    'summary',
    'description',
    'previewText',
    'fact',
    'source',
  ]) {
    const work = bilingualFixture().works[0];
    assert.equal(needsReview(work, 'en'), false);
    if (change === 'body') work.versions.zh!.body += '更新';
    else if (change === 'fact') work.meta.facts[0].value.zh = '另一个作者';
    else if (change === 'source') work.meta.sourceUrl = 'https://example.org/revised';
    else if (change === 'previewText') work.versions.zh!.data.previewText.display = '新的展示说明';
    else work.versions.zh!.data[change as 'title' | 'summary' | 'description'] += '更新';
    assert.equal(needsReview(work, 'en'), true, change);
    assert.equal(needsReview(work, 'zh'), false);
    work.versions.en!.data.sourceRevision = sourceRevision(work);
    assert.equal(needsReview(work, 'en'), false);
  }
});

test('ordering, layout, translated wording and newline conventions do not stale a translation', () => {
  const work = bilingualFixture().works[0];
  const revision = sourceRevision(work);
  work.meta.order += 1;
  work.meta.preview.color = '#000';
  work.versions.en!.body += 'Edited translation';
  work.versions.zh!.body = work.versions.zh!.body.replaceAll('\n', '\r\n');
  assert.equal(sourceRevision(work), revision);
  assert.equal(needsReview(work, 'en'), false);
});
