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
