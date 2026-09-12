import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { scriptBudget } from '../../scripts/script-budget.ts';
const size = (source: string) => gzipSync(source).length;

test('island dependencies are counted once, shared and orphan chunks stay in the common budget', () => {
  const scripts = new Map([
    ['/_astro/page.js', 'import "./shared.js"; import("./lazy.js");'],
    ['/_astro/shared.js', 'export const value = 1;'],
    ['/_astro/lazy.js', 'export const lazy = true;'],
    ['/_astro/demo.js', 'import "./shared.js"; import "./react.js";'],
    ['/_astro/react.js', 'export const react = true;'],
    ['/_astro/orphan.js', 'console.log("unused but still counted");'],
  ]);
  const ordinary = '<script src="/_astro/page.js"></script>';
  const mdx =
    ordinary +
    '<astro-island component-url="/_astro/demo.js" renderer-url="/_astro/react.js"></astro-island>'.repeat(
      2,
    );
  const measured = scriptBudget(scripts, [ordinary, mdx]);
  assert.equal(
    measured.mdxJavascriptGzip,
    size(scripts.get('/_astro/demo.js')!) + size(scripts.get('/_astro/react.js')!),
  );
  assert.equal(
    measured.javascriptGzip + measured.mdxJavascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
  scripts.set('/_astro/page.js', scripts.get('/_astro/page.js')! + 'import "./react.js";');
  assert.equal(
    scriptBudget(scripts, [ordinary, mdx]).mdxJavascriptGzip,
    size(scripts.get('/_astro/demo.js')!),
  );
});

test('inline bootstraps count once and missing imports fail instead of undercounting', () => {
  const scripts = new Map([['/_astro/demo.js', 'export default 1;']]);
  const body = 'self.Astro = {};';
  const page = `<astro-island component-url="/_astro/demo.js"></astro-island><script>${body}</script>`;
  assert.equal(
    scriptBudget(scripts, [page, page]).mdxJavascriptGzip,
    size('export default 1;') + size(body),
  );
  assert.equal(
    scriptBudget(scripts, [page, `<script>${body}</script>`]).javascriptGzip,
    size(body),
  );
  scripts.set('/_astro/demo.js', 'import "./missing.js";');
  assert.throws(() => scriptBudget(scripts, [page]), /Missing bundled script/);
});

test('dependency cycles are finite and modulepreload cannot hide React in the island allowance', () => {
  const scripts = new Map([
    ['/_astro/a.js', 'export * from "./b.js";'],
    ['/_astro/b.js', 'import "./a.js";'],
  ]);
  const result = scriptBudget(scripts, [
    '<link href="/_astro/a.js" rel="modulepreload">',
    '<astro-island component-url="/_astro/a.js"></astro-island>',
  ]);
  assert.equal(result.mdxJavascriptGzip, 0);
  assert.equal(
    result.javascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
});

test('independent MDX articles have separate budgets; repeated instances add no JS copies', () => {
  const scripts = new Map([
    ['/_astro/a.js', 'export const a = 1;'],
    ['/_astro/b.js', 'export const b = 2;'],
  ]);
  const a = '<astro-island component-url="/_astro/a.js"></astro-island>';
  const b = '<astro-island component-url="/_astro/b.js"></astro-island>';
  const separate = scriptBudget(scripts, [a, b]);
  assert.equal(separate.javascriptGzip, 0);
  assert.equal(separate.mdxJavascriptGzip, Math.max(...[...scripts.values()].map(size)));
  assert.equal(
    scriptBudget(scripts, [a.repeat(20), b]).mdxJavascriptGzip,
    separate.mdxJavascriptGzip,
  );
  assert.equal(
    scriptBudget(scripts, [a + b]).mdxJavascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
});

test('only lazy media entry qualifies; eager and shared dependencies remain common', () => {
  const scripts = new Map([
    ['/_astro/boot.js', 'import "./shared.js"; import("./media.abc.js");'],
    ['/_astro/media.abc.js', 'import "./shared.js"; import("./chart.js");'],
    ['/_astro/shared.js', 'export const shared = 1;'],
    ['/_astro/chart.js', 'export const chart = 1;'],
  ]);
  const html = '<script src="/_astro/boot.js"></script>';
  const measured = scriptBudget(scripts, [html]);
  assert.equal(
    measured.mediaJavascriptGzip,
    size(scripts.get('/_astro/media.abc.js')!) + size(scripts.get('/_astro/chart.js')!),
  );
  assert.equal(
    measured.javascriptGzip + measured.mediaJavascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
  assert.equal(
    scriptBudget(scripts, [html + '<link rel="modulepreload" href="/_astro/media.abc.js">'])
      .mediaJavascriptGzip,
    0,
  );
  scripts.set('/_astro/boot.js', 'import "./media.abc.js";');
  assert.equal(scriptBudget(scripts, [html]).mediaJavascriptGzip, 0);
});

test('the on-demand MIT game is budgeted and arbitrary public scripts are not exempt', () => {
  const scripts = new Map([
    ['/_astro/boot.js', 'import("./media.abc.js");'],
    ['/_astro/media.abc.js', 'export const media = true;'],
    ['/media/2048/game.js', 'const game = "reviewed MIT game";'],
    ['/unexpected.js', 'const unexpected = true;'],
  ]);
  const result = scriptBudget(scripts, ['<script src="/_astro/boot.js"></script>']);
  assert.equal(
    result.mediaJavascriptGzip,
    size(scripts.get('/_astro/media.abc.js')!) + size(scripts.get('/media/2048/game.js')!),
  );
  assert.equal(
    scriptBudget(scripts, [
      '<script src="/_astro/boot.js"></script><script src="/media/2048/game.js"></script>',
    ]).mediaJavascriptGzip,
    size(scripts.get('/_astro/media.abc.js')!),
  );
  assert.equal(
    result.javascriptGzip,
    size(scripts.get('/_astro/boot.js')!) + size(scripts.get('/unexpected.js')!),
  );
});

test('assistant inventory counts all native chunks and host dependencies, preserving common helpers', async () => {
  const { createHash } = await import('node:crypto');
  const prefix = '/vendor/paseo/0123456789abcdef';
  const scripts = new Map([
    ['/_astro/boot.js', 'import "./shared.js"; import("./host.abc.js");'],
    ['/_astro/host.abc.js', 'import "./shared.js"; import "./private.js";'],
    ['/_astro/shared.js', 'export const shared = 1;'],
    ['/_astro/private.js', 'export const privateValue = 2;'],
    [prefix + '/entry.js', 'nativeEntry();'],
    [prefix + '/lazy.js', 'nativeOptional();'],
    ['/_astro/orphan.js', 'unknownMustStayCommon();'],
  ]);
  const nativeFiles = [...scripts].filter(([path]) => path.startsWith(prefix));
  const config = {
    basePath: prefix,
    scripts: nativeFiles.map(([path, source]) => ({
      path,
      sha256: createHash('sha256').update(source).digest('hex'),
    })),
  };
  const pages = ['<script src="/_astro/boot.js"></script>'];
  const measured = scriptBudget(scripts, pages, config);
  assert.equal(
    measured.assistantTotalJavascriptGzip,
    ['/_astro/host.abc.js', '/_astro/private.js', ...nativeFiles.map(([path]) => path)].reduce(
      (sum, path) => sum + size(scripts.get(path)!),
      0,
    ),
  );
  assert.equal(
    measured.javascriptGzip + measured.assistantTotalJavascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
  assert.throws(
    () => scriptBudget(scripts, [...pages, `<script src="${prefix}/entry.js"></script>`], config),
    /leaked/,
  );
  assert.throws(
    () =>
      scriptBudget(
        scripts,
        [...pages, '<link rel="modulepreload" href="/_astro/host.abc.js">'],
        config,
      ),
    /statically/,
  );
  scripts.set('/_astro/boot.js', 'import "./host.abc.js";');
  assert.throws(() => scriptBudget(scripts, pages, config), /dynamically/);
  scripts.set('/_astro/boot.js', 'import("./host.abc.js");');
  scripts.set(prefix + '/unknown.js', 'unlisted();');
  assert.throws(() => scriptBudget(scripts, pages, config), /Unknown assistant/);
  scripts.delete(prefix + '/unknown.js');
  scripts.set(prefix + '/lazy.js', 'changed();');
  assert.throws(() => scriptBudget(scripts, pages, config), /differs/);
});
test('assistant helpers shared with media remain counted in the ordinary allowance', async () => {
  const { createHash } = await import('node:crypto');
  const prefix = '/vendor/paseo/0123456789abcdef';
  const scripts = new Map([
    ['/_astro/boot.js', 'import("./media.abc.js"); import("./host.abc.js");'],
    ['/_astro/media.abc.js', 'import "./shared.js";'],
    ['/_astro/host.abc.js', 'import "./shared.js";'],
    ['/_astro/shared.js', 'export const shared = true;'],
    [prefix + '/entry.js', 'native();'],
  ]);
  const measured = scriptBudget(scripts, ['<script src="/_astro/boot.js"></script>'], {
    basePath: prefix,
    scripts: [
      {
        path: prefix + '/entry.js',
        sha256: createHash('sha256').update('native();').digest('hex'),
      },
    ],
  });
  assert.equal(
    measured.javascriptGzip,
    size(scripts.get('/_astro/boot.js')!) + size(scripts.get('/_astro/shared.js')!),
  );
  assert.equal(
    measured.javascriptGzip + measured.mediaJavascriptGzip + measured.assistantTotalJavascriptGzip,
    [...scripts.values()].reduce((sum, source) => sum + size(source), 0),
  );
});

test('an unverified vendor script fails even when the assistant is disabled', () => {
  assert.throws(
    () =>
      scriptBudget(new Map([['/vendor/paseo/0123456789abcdef/entry.js', 'native();']]), [
        '<p>site</p>',
      ]),
    /Unknown assistant/,
  );
});
