import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { setImmediate } from 'node:timers';

// Execute the installed, patched native loader. This is run while build patches
// are applied, so a copied implementation cannot mask changes in the dependency.
const root = resolve(process.argv[2]);
const read = (path) =>
  readFileSync(resolve(root, 'node_modules/expo/src/async-require', path), 'utf8');
const pending = new Map();
const requests = [];
const bundleSource = stripTypeScriptTypes(read('buildAsyncRequire.ts'))
  .replace("import { loadBundleAsync } from './loadBundle';", '')
  .replace('export function', 'function');
const loadBundle = runInNewContext(`${bundleSource}\nbuildAsyncRequire();`, {
  loadBundleAsync(path) {
    requests.push(path);
    return new Promise((resolve, reject) => pending.set(path, { resolve, reject }));
  },
});
let evaluations = 0;
const nativeRequire = Object.assign(() => {}, {
  importAll(id) {
    evaluations++;
    return { id };
  },
});
const module = { exports: {} };
runInNewContext(stripTypeScriptTypes(read('asyncRequireModule.ts')), {
  module,
  require: nativeRequire,
  global: { __loadBundleAsync: loadBundle },
  __METRO_GLOBAL_PREFIX__: '',
});
const asyncRequire = module.exports;
const first = asyncRequire(1, { 1: ['/shared.js', '/first.js'] });
const second = asyncRequire(2, { 2: ['/shared.js', '/second.js'] });
assert.deepEqual(requests, ['/shared.js', '/first.js', '/second.js']);
pending.get('/first.js').resolve();
pending.get('/second.js').resolve();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(evaluations, 0, 'Neither target may evaluate before the shared definitions load');
pending.get('/shared.js').resolve();
assert.equal((await first).id, 1);
assert.equal((await second).id, 2);
assert.equal(evaluations, 2);
const failed = asyncRequire(3, { 3: ['/failure.js', '/third.js'] });
pending.get('/third.js').resolve();
pending.get('/failure.js').reject(new Error('fixture network failure'));
await assert.rejects(failed, /fixture network failure/);
assert.equal(evaluations, 2, 'Failed prerequisites must prevent evaluation');
const retried = asyncRequire(3, { 3: ['/failure.js', '/third.js'] });
assert.equal(requests.filter((p) => p === '/failure.js').length, 2);
assert.equal(requests.filter((p) => p === '/third.js').length, 1);
pending.get('/failure.js').resolve();
assert.equal((await retried).id, 3);
const legacy = asyncRequire(4, { 4: '/legacy.js' });
pending.get('/legacy.js').resolve();
assert.equal((await legacy).id, 4);
assert.equal((await asyncRequire(5, null)).id, 5);
console.log(
  'Native async loader: shared prerequisite ordering, concurrent deduplication, failure, retry, legacy string and synchronous module passed.',
);
