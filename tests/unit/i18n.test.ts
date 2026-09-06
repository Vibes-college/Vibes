import assert from 'node:assert/strict';
import { test } from 'node:test';
import { locales, isLocale, workPath, browsePath, withQuery } from '../../src/lib/i18n/routes.ts';
import { messages } from '../../src/lib/i18n/messages.ts';
import {
  publishedWorks,
  adjacentWorks,
  languageTarget,
  browsePages,
} from '../../src/lib/content/views.ts';
import { bilingualFixture, catalogFixture } from '../fixtures/catalog.ts';

test('locale URLs retain identities and encode user queries without creating arbitrary languages', () => {
  assert.deepEqual(locales, ['zh', 'en']);
  assert.equal(isLocale('fr'), false);
  assert.equal(workPath('en', 'work-0'), '/en/works/work-0/');
  assert.equal(browsePath('zh', 'paper', 3), '/zh/tags/paper/page/3/');
  assert.equal(withQuery('/zh/', 'a&b #1'), '/zh/?q=a%26b%20%231');
  assert.deepEqual(Object.keys(messages.zh), Object.keys(messages.en));
  assert.ok(Object.values(messages.en).every(Boolean));
});

test('language switching never substitutes an original for a missing or draft translation', () => {
  const catalog = bilingualFixture();
  assert.equal(languageTarget(catalog, 'work-0', 'en')?.href, '/en/works/work-0/');
  catalog.works[0].versions.en!.data.status = 'draft';
  assert.deepEqual(languageTarget(catalog, 'work-0', 'en'), {
    href: undefined,
    originalHref: '/zh/works/work-0/',
  });
  delete catalog.works[1].versions.en;
  assert.deepEqual(publishedWorks(catalog, 'en'), []);
  assert.equal(languageTarget(catalog, 'missing', 'en'), undefined);
});

test('adjacent navigation does not wrap or treat an unknown identity as the first work', () => {
  const works = publishedWorks(catalogFixture(), 'zh');
  assert.equal(adjacentWorks(works, 'work-0').previous, undefined);
  assert.equal(adjacentWorks(works, 'work-1').next, undefined);
  assert.deepEqual(adjacentWorks([], 'missing'), { previous: undefined, next: undefined });
  assert.deepEqual(adjacentWorks(works, 'missing'), { previous: undefined, next: undefined });
  assert.deepEqual(adjacentWorks([works[0]], 'work-0'), { previous: undefined, next: undefined });
});

test('static paging bounds the first, middle and last page and emits no draft-language work pages', () => {
  const catalog = catalogFixture(49);
  const pages = browsePages(catalog, 'zh').filter((page) => !page.tag);
  assert.deepEqual(
    pages.map((page) => page.works.length),
    [24, 24, 1],
  );
  assert.equal(pages[2].works[0].slug, 'work-48');
  assert.deepEqual(
    browsePages(catalog, 'en').map((page) => [page.path, page.works.length]),
    [['/en/', 0]],
  );
});
