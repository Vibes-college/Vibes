import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertFrozen, parseDocument, type Document } from '../../scripts/docs-frontmatter.ts';
import { expectedTense, reviewDocumentSize, validateDocument } from '../../scripts/docs-policy.ts';
import { validateIndexes } from '../../scripts/docs-index.ts';

// 创建与真实治理元数据同格式的测试文档。
function document(path: string, meta: Record<string, unknown>, body = '# Behavior\n'): Document {
  const source = `---\n${Object.entries(meta)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')}\n---\n\n${body}`;
  return parseDocument(path, source);
}

// 生成有完整索引与最后同步任务的最小规格，供多种失败场景独立修改。
function catalog(): Map<string, Document> {
  const living = {
    tense: 'living',
    describes: 'Current behavior',
    status: 'current',
    'shaped-by': [],
  };
  const frozen = { tense: 'frozen', describes: 'Decision', status: 'draft', 'amended-by': [] };
  const docs = [
    document('docs/features/example.md', living),
    document('docs/features/README.md', living, '| [Example](example.md) | current | / | — |\n'),
    document('specs/README.md', living, '| [001](001-example/spec.md) | draft | example |\n'),
    document('specs/001-example/spec.md', {
      ...frozen,
      'feature-ids': ['example'],
      amends: [],
      'approved-artifacts': [],
    }),
    document('specs/001-example/plan.md', frozen),
    document(
      'specs/001-example/tasks.md',
      frozen,
      '- [ ] T001 更新docs/features/example.md最终行为，shaped-by；docs/features/README.md与specs/README.md\n',
    ),
  ];
  return new Map(docs.map((doc) => [doc.path, doc]));
}

// 确认格式化器产生的单引号、跨行数组和转义仍能解析，歧义输入不会被忽略。
test('document metadata handles formatted arrays and rejects malformed or duplicate fields', () => {
  const doc = parseDocument(
    'a.md',
    "---\ntense: 'living'\nshaped-by:\n  [\n    '001',\n    '002',\n  ]\ndescribes: 'it''s current'\n---\nBody\n",
  );
  assert.deepEqual(doc.meta['shaped-by'], ['001', '002']);
  assert.equal(doc.meta.describes, "it's current");
  for (const source of [
    'Body',
    '---\ntense: living\ntense: frozen\n---\n',
    '---\nids: [a b]\n---\n',
    '---\nids: [[1]]\n---\n',
  ]) {
    assert.throws(() => parseDocument('a.md', source));
  }
});

// 已冻结正文和元数据不可被改写，允许明确追加后继关系与superseded状态。
test('frozen protection permits only forward metadata changes and rejects deletion', () => {
  const meta = {
    tense: 'frozen',
    describes: 'Decision',
    status: 'merged',
    'frozen-at': '2026-09-05',
    'amended-by': [],
  };
  const old = document('specs/001-example/spec.md', meta, '# Original\n');
  assert.doesNotThrow(() =>
    assertFrozen(
      old,
      document(
        old.path,
        { ...meta, status: 'superseded', 'amended-by': ['002'] },
        old.body.trimStart(),
      ),
    ),
  );
  assert.throws(() => assertFrozen(old), /删除/);
  assert.throws(() => assertFrozen(old, document(old.path, meta, '# Changed\n')), /正文/);
  assert.throws(
    () => assertFrozen(old, document(old.path, { ...meta, describes: 'Other' }, '# Original\n')),
    /仅可改/,
  );
  assert.throws(
    () => assertFrozen(old, document(old.path, { ...meta, status: 'draft' }, '# Original\n')),
    /回退/,
  );
  const linked = document(old.path, { ...meta, 'amended-by': ['002'] }, '# Original\n');
  assert.throws(() => assertFrozen(linked, old), /只许追加/);
});

// 原则条目只能在末尾追加，不能修改既有条目的一个字。
test('lessons allow append-only decisions but forbid editing existing entries', () => {
  const meta = {
    tense: 'frozen',
    describes: 'Lessons',
    status: 'merged',
    'frozen-at': '2026-09-05',
    'amended-by': [],
  };
  const old = document('docs/LESSONS.md', meta, '## L-001 First\n');
  assert.doesNotThrow(() =>
    assertFrozen(old, document(old.path, meta, '## L-001 First\n\n## L-002 Second\n')),
  );
  assert.throws(() => assertFrozen(old, document(old.path, meta, '## L-001 Edited\n')), /不可修改/);
});

// 附件必须同时有白名单形式和规格中的明确用途，普通额外文档不能搭便车。
test('optional artifacts require a declared purpose without per-file user approval', () => {
  const docs = catalog();
  const path = 'specs/001-example/data-model.md';
  assert.equal(expectedTense(path, docs), undefined);
  const spec = docs.get('specs/001-example/spec.md')!;
  docs.set(
    spec.path,
    document(
      spec.path,
      {
        ...spec.meta,
        'approved-artifacts': ['data-model.md'],
      },
      'data-model.md defines the approved schema.\n',
    ),
  );
  assert.equal(expectedTense(path, docs), 'frozen');
  assert.equal(expectedTense('specs/001-example/extra.md', docs), undefined);
  assert.equal(expectedTense('docs/random.md', docs), undefined);
});

// 时态错误必须拒绝，自然语言由人工审阅；长文档仅提示人工审阅。
test('document policy rejects invalid semantics but long documents only request review', () => {
  const docs = catalog();
  const doc = docs.get('docs/features/example.md')!;
  assert.doesNotThrow(() => validateDocument(doc, docs));
  assert.throws(
    () => validateDocument(document(doc.path, { ...doc.meta, tense: 'scratch' }), docs),
    /tense/,
  );
  assert.throws(
    () => validateDocument(document(doc.path, { ...doc.meta, 'shaped-by': '001' }), docs),
    /数组/,
  );
  const long = document(doc.path, doc.meta, 'line\n'.repeat(121));
  assert.doesNotThrow(() => validateDocument(long, docs));
  assert.match(reviewDocumentSize(long) ?? '', /建议审阅/);
  assert.doesNotThrow(() =>
    validateDocument(
      document(doc.path, doc.meta, '引用中包含曾经，不以词语判断文档质量。\n'),
      docs,
    ),
  );
});

// 索引双向比较拒绝漏项、重复项、状态漂移；完整大规格不因行数失败。
test('indexes enforce inventories without fixed task wording or spec-size limits', () => {
  assert.doesNotThrow(() => validateIndexes(catalog()));
  const missing = catalog();
  missing.delete('docs/features/example.md');
  assert.throws(() => validateIndexes(missing), /索引/);
  const stale = catalog();
  const index = stale.get('specs/README.md')!;
  stale.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | merged | example |\n'),
  );
  assert.throws(() => validateIndexes(stale), /状态/);
  const duplicate = catalog();
  const fi = duplicate.get('docs/features/README.md')!;
  duplicate.set(fi.path, document(fi.path, fi.meta, fi.body + fi.body));
  assert.throws(() => validateIndexes(duplicate), /重复/);
  const unfinished = catalog();
  const task = unfinished.get('specs/001-example/tasks.md')!;
  unfinished.set(task.path, document(task.path, task.meta, '- [ ] T001 implement only\n'));
  assert.doesNotThrow(() => validateIndexes(unfinished));
  const big = catalog();
  const plan = big.get('specs/001-example/plan.md')!;
  big.set(plan.path, document(plan.path, plan.meta, 'line\n'.repeat(300)));
  assert.doesNotThrow(() => validateIndexes(big));
});

// 编号引用必须存在，合并状态不允许未完成任务或漏掉现状来源。
test('relations and merged tasks cannot reference absent specs or skip completion', () => {
  const docs = catalog();
  const spec = docs.get('specs/001-example/spec.md')!;
  docs.set(spec.path, document(spec.path, { ...spec.meta, amends: ['999'] }));
  assert.throws(() => validateIndexes(docs), /双向关系/);
  const closed = catalog();
  for (const [path, doc] of closed) {
    if (path.startsWith('specs/001-example/'))
      closed.set(
        path,
        document(
          path,
          { ...doc.meta, status: 'merged', 'frozen-at': '2026-09-05' },
          doc.body.trimStart(),
        ),
      );
  }
  const index = closed.get('specs/README.md')!;
  closed.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | merged | example |\n'),
  );
  assert.throws(() => validateIndexes(closed), /未完成/);
});

// research不是无条件产物，索引来源和合并日期也必须准确。
test('research triggers, feature provenance and calendar dates are validated', () => {
  const docs = catalog();
  const spec = docs.get('specs/001-example/spec.md')!;
  docs.set(
    'specs/001-example/research.md',
    document('specs/001-example/research.md', {
      tense: 'frozen',
      describes: 'Decision',
      status: 'draft',
      'amended-by': [],
    }),
  );
  assert.throws(() => validateIndexes(docs), /取舍/);
  docs.set(
    spec.path,
    document(spec.path, {
      ...spec.meta,
      'research-trigger': '重要取舍：预生成与按需渲染的边界',
    }),
  );
  assert.doesNotThrow(() => validateIndexes(docs));
  const feature = docs.get('docs/features/example.md')!;
  docs.set(feature.path, document(feature.path, { ...feature.meta, 'shaped-by': ['001'] }));
  assert.throws(() => validateIndexes(docs), /shaped-by不一致/);
  const invalid = document(spec.path, {
    ...spec.meta,
    status: 'merged',
    'frozen-at': '2026-02-31',
  });
  assert.throws(() => validateDocument(invalid, docs), /frozen-at/);
});

// 合并日期未知可省略，首次据实补记后不可篡改日期或正文。
test('freeze metadata allows a missing merge date and one later annotation', () => {
  const meta = { tense: 'frozen', describes: 'Decision', status: 'merged', 'amended-by': [] };
  const old = document('specs/001-example/plan.md', meta);
  assert.doesNotThrow(() => validateDocument(old, catalog()));
  const dated = document(old.path, { ...meta, 'frozen-at': '2026-09-05' });
  assert.doesNotThrow(() => assertFrozen(old, dated));
  assert.throws(
    () => assertFrozen(dated, document(old.path, { ...meta, 'frozen-at': '2026-09-06' })),
    /仅可改/,
  );
});

// 需求阶段允许逐步产生计划、任务与未来功能文档，合并前才检查交付完整性。
test('draft specs do not require placeholder plans, tasks or unimplemented feature documents', () => {
  const docs = catalog();
  docs.delete('specs/001-example/plan.md');
  docs.delete('specs/001-example/tasks.md');
  const spec = docs.get('specs/001-example/spec.md')!;
  docs.set(spec.path, document(spec.path, { ...spec.meta, 'feature-ids': ['future-feature'] }));
  const index = docs.get('specs/README.md')!;
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | draft | future-feature |\n'),
  );
  assert.doesNotThrow(() => validateIndexes(docs));
  docs.set(
    spec.path,
    document(spec.path, { ...spec.meta, status: 'merged', 'feature-ids': ['future-feature'] }),
  );
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | merged | future-feature |\n'),
  );
  assert.throws(() => validateIndexes(docs), /缺少plan\/tasks/);
});

// 归并旧文档后历史编号仍须落到唯一现状，不能用别名掩盖来源或缺失。
test('legacy feature ids resolve merged history and reject ambiguous ownership', () => {
  const docs = catalog();
  for (const [path, doc] of docs) {
    if (path.startsWith('specs/001-example/'))
      docs.set(
        path,
        document(path, { ...doc.meta, status: 'merged' }, doc.body.replace('- [ ]', '- [x]')),
      );
  }
  const index = docs.get('specs/README.md')!;
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | merged | example |\n'),
  );
  const original = docs.get('docs/features/example.md')!;
  docs.delete(original.path);
  const merged = document('docs/features/journey.md', {
    ...original.meta,
    'shaped-by': ['001'],
    'legacy-feature-ids': ['example'],
  });
  docs.set(merged.path, merged);
  const fi = docs.get('docs/features/README.md')!;
  docs.set(fi.path, document(fi.path, fi.meta, '| [Journey](journey.md) | current | / | 001 |\n'));
  assert.doesNotThrow(() => validateIndexes(docs));
  for (const ids of [[], ['journey'], ['example', 'example'], ['../example']]) {
    docs.set(merged.path, document(merged.path, { ...merged.meta, 'legacy-feature-ids': ids }));
    assert.throws(() => validateIndexes(docs), /不存在|冲突|重复|无效/);
  }
  docs.set(merged.path, document(merged.path, { ...merged.meta, 'legacy-feature-ids': 'example' }));
  assert.throws(() => validateIndexes(docs), /数组/);
  docs.set(merged.path, document(merged.path, { ...merged.meta, 'shaped-by': [] }));
  docs.set(fi.path, document(fi.path, fi.meta, '| [Journey](journey.md) | current | / | — |\n'));
  assert.throws(() => validateIndexes(docs), /缺少合并规格/);
  docs.set(merged.path, merged);
  docs.set('docs/features/another.md', document('docs/features/another.md', { ...merged.meta }));
  assert.throws(() => validateIndexes(docs), /重复归属/);
  docs.delete('docs/features/another.md');
  docs.set(original.path, original);
  assert.throws(() => validateIndexes(docs), /冲突/);
});

// 实现完成独立于是否合并；已完成清单不应永久停留在进行中。
test('complete describes implementation readiness and completed tasks cannot remain in progress', () => {
  const docs = catalog();
  for (const [path, item] of docs) {
    if (path.startsWith('specs/001-example/'))
      docs.set(
        path,
        document(path, { ...item.meta, status: 'complete' }, item.body.replace('- [ ]', '- [x]')),
      );
  }
  const feature = docs.get('docs/features/example.md')!;
  docs.set(feature.path, document(feature.path, { ...feature.meta, 'shaped-by': ['001'] }));
  const fi = docs.get('docs/features/README.md')!;
  docs.set(fi.path, document(fi.path, fi.meta, '| [Example](example.md) | current | / | 001 |\n'));
  const index = docs.get('specs/README.md')!;
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | complete | example |\n'),
  );
  assert.doesNotThrow(() => validateIndexes(docs));
  const spec = docs.get('specs/001-example/spec.md')!;
  assert.doesNotThrow(() => validateDocument(spec, docs));
  assert.throws(() => assertFrozen(spec, document(spec.path, spec.meta, '# Tampered\n')), /正文/);
  for (const [path, item] of docs) {
    if (path.startsWith('specs/001-example/'))
      docs.set(
        path,
        document(path, { ...item.meta, status: 'in-progress' }, item.body.trimStart()),
      );
  }
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | in-progress | example |\n'),
  );
  assert.throws(() => validateIndexes(docs), /全部任务已完成/);
});

// 索引展示排序不能修改元数据，否则相同冻结文件会被误报为遭到篡改。
test('index sorting preserves frozen feature metadata order', () => {
  const docs = catalog();
  const original = docs.get('specs/001-example/spec.md')!;
  const ordered = document(original.path, { ...original.meta, 'feature-ids': ['zeta', 'example'] });
  docs.set(original.path, ordered);
  const index = docs.get('specs/README.md')!;
  docs.set(
    index.path,
    document(index.path, index.meta, '| [001](001-example/spec.md) | draft | example, zeta |\n'),
  );
  validateIndexes(docs);
  assert.deepEqual(ordered.meta['feature-ids'], ['zeta', 'example']);
  const frozen = { ...ordered.meta, status: 'complete' };
  assert.doesNotThrow(() =>
    assertFrozen(document(ordered.path, frozen), document(ordered.path, frozen)),
  );
});
