import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readCatalog } from '../src/lib/content/catalog.ts';
import { sourceRevision } from '../src/lib/content/revision.ts';

// 同一隔离作品反复真实构建，确认发布/草稿/待复核不会被Astro缓存或旧产物污染。
export function verifyContentLifecycle() {
  mkdirSync('.scratch', { recursive: true });
  const root = mkdtempSync(resolve('.scratch/lifecycle-'));
  try {
    const catalog = readCatalog();
    const work = structuredClone(catalog.works.find((work) => work.versions.en)!);
    assert.ok(work.versions.en, 'Lifecycle verification requires the reviewed English example');
    const translation = structuredClone(work.versions.en!);
    const directory = join(root, 'works', work.meta.id);
    mkdirSync(directory, { recursive: true });
    const taxonomy = join(root, 'taxonomy.json');
    const out = join(root, 'dist');
    writeFileSync(taxonomy, JSON.stringify(catalog.taxonomy));
    const states = [];
    for (const state of ['original-only', 'draft', 'published', 'stale', 'reviewed'] as const) {
      if (state === 'original-only') delete work.versions.en;
      if (state === 'draft')
        work.versions.en = { ...translation, data: { ...translation.data, status: 'draft' } };
      if (state === 'published') work.versions.en!.data.status = 'published';
      if (state === 'stale') work.versions.zh!.body += '\n\n新增原文内容。\n';
      if (state === 'reviewed') work.versions.en!.data.sourceRevision = sourceRevision(work);
      writeFileSync(join(directory, 'work.json'), JSON.stringify(work.meta));
      for (const [locale, version] of Object.entries(work.versions))
        writeFileSync(
          join(directory, `${locale}.md`),
          `---\n${Object.entries(version.data)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n')}\n---${version.body}`,
        );
      const build = spawnSync('npm', ['run', 'build'], {
        env: {
          ...process.env,
          VIBES_CONTENT_DIR: join(root, 'works'),
          VIBES_TAXONOMY_FILE: taxonomy,
          VIBES_OUT_DIR: out,
        },
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });
      assert.equal(build.status, 0, `${state}: ${build.stdout}\n${build.stderr}`);
      const expected = !['original-only', 'draft'].includes(state);
      const detail = join(out, 'en/works', work.meta.id, 'index.html');
      assert.equal(existsSync(detail), expected, `${state}: route publication`);
      assert.equal(
        readFileSync(join(out, 'sitemap.xml'), 'utf8').includes(`/en/works/${work.meta.id}/`),
        expected,
        `${state}: sitemap publication`,
      );
      assert.match(build.stdout, expected ? /Indexed 2 pages/ : /Indexed 1 page/);
      if (expected)
        assert.equal(
          readFileSync(detail, 'utf8').includes('class="translation-notice"'),
          state === 'stale',
          `${state}: review notice`,
        );
      assert.equal(
        (readFileSync(join(out, 'en/index.html'), 'utf8').match(/class="work-card"/g) || []).length,
        expected ? 1 : 0,
      );
      states.push(state);
    }
    return states;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
