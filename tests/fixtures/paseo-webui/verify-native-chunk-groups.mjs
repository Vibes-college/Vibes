import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = resolve(process.argv[2]);
const file = resolve(root, 'node_modules/@expo/metro-config/build/serializer/serializeChunks.js');
const require = createRequire(file);
const { Chunk } = require(file);
const source = readFileSync(file, 'utf8');
const start = source.indexOf('        const asyncChunks =');
const end = source.indexOf('        // Remove empty chunks', start);
assert(start > 0 && end > start, 'The fixed native grouping block must be present');
const grouping = source.slice(start, end);
const graph = { transformOptions: { platform: 'web' } };
const options = { dev: true, serializerOptions: { splitChunks: true } };
const edge = (path, asyncType = null) => ({ absolutePath: path, data: { data: { asyncType } } });
const module = (path, edges = []) => ({
  path,
  dependencies: new Map(edges.map((value) => [value.absolutePath, value])),
});
const helper = module('/helper.js');
const grammar = module('/grammar.js', [edge(helper.path)]);
const locale = module('/locale.js', [edge(helper.path)]);
const a = module('/a.js', [edge(grammar.path), edge('/c.js', 'async')]);
const b = module('/b.js', [edge(grammar.path)]);
const c = module('/c.js', [edge(locale.path)]);
const d = module('/d.js', [edge(locale.path)]);
const main = module('/index.js', [edge(a.path, 'async')]);
const entryChunk = new Chunk(main.path, [main], graph, options, false, false, true);
const chunks = new Set([
  entryChunk,
  new Chunk(a.path, [a, grammar, helper], graph, options, true),
  new Chunk(b.path, [b, grammar, helper], graph, options, true),
  new Chunk(c.path, [c, locale, helper], graph, options, true),
  new Chunk(d.path, [d, locale, helper], graph, options, true),
]);
const run = (chunks) =>
  runInNewContext(grouping, {
    chunks,
    entryChunk,
    graph,
    options,
    Chunk,
    isResolvedDependency_1: require('@expo/metro/metro/lib/isResolvedDependency'),
  });
run(chunks);
const owner = (module) => [...chunks].find((chunk) => chunk.deps.has(module));
assert.equal(chunks.size, 8, 'Four targets, three different shared groups and one entry');
assert.equal(entryChunk.requiredChunks.size, 0, 'No async shared group becomes initial');
for (const module of [main, a, b, c, d, grammar, locale, helper]) {
  assert.equal(
    [...chunks].filter((chunk) => chunk.deps.has(module)).length,
    1,
    'Every module has exactly one owner',
  );
}
assert.deepEqual([...owner(a).requiredChunks], [owner(grammar)]);
assert.deepEqual([...owner(grammar).requiredChunks], [owner(helper)]);
assert.deepEqual([...owner(locale).requiredChunks], [owner(helper)]);
const paths = entryChunk.getComputedPathsForAsyncDependencies({}, [...chunks])[a.path];
assert.deepEqual(
  [...paths].sort(),
  [owner(a), owner(grammar), owner(helper)].map((chunk) => '/' + chunk.name).sort(),
);
assert(!paths.includes('/' + owner(locale).name), 'Grammar activation must not pull locale data');
const languagePaths = owner(a).getComputedPathsForAsyncDependencies({}, [...chunks])[c.path];
assert.deepEqual(
  [...languagePaths].sort(),
  [owner(c), owner(locale), owner(helper)].map((chunk) => '/' + chunk.name).sort(),
);
assert(
  !languagePaths.includes('/' + owner(grammar).name),
  'Language activation must not pull grammar data',
);
assert.throws(
  () => run(new Set([entryChunk, new Chunk('/worker.js', [], graph, options, true, false, true)])),
  /do not support worker entries/,
);
console.log(
  'Installed native shared-group ownership, transitive prerequisites, async isolation and worker rejection passed.',
);
