import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { databaseArgs, requireAction } from '../../scripts/local-tools.ts';

// 验证从空库建立结构后，测试数据可读且唯一约束真实生效。
test('migrations and seed create usable records with unique names', () => {
  const db = new DatabaseSync(':memory:');
  try {
    for (const file of readdirSync('db/migrations').sort()) {
      db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
    }
    db.exec(readFileSync('db/seed.sql', 'utf8'));
    assert.equal(db.prepare('SELECT count(*) AS total FROM local_test_records').get()?.total, 2);
    assert.throws(
      () =>
        db.exec(
          "INSERT INTO local_test_records (name, description) VALUES ('first-example', 'duplicate')",
        ),
      /UNIQUE/,
    );
  } finally {
    db.close();
  }
});

// 验证本地命令始终包含本地限定，且拒绝远程与多余参数。
test('database commands reject remote and unexpected arguments', () => {
  for (const action of ['migrate', 'seed'] as const) {
    assert.ok(databaseArgs(action).includes('--local'));
    assert.ok(!databaseArgs(action).includes('--remote'));
  }
  assert.equal(requireAction(['reset'], ['reset', 'migrate']), 'reset');
  for (const args of [[], ['reset', '--remote'], ['remote'], ['migrate', '--config', 'other']]) {
    assert.throws(() => requireAction(args, ['reset', 'migrate']), /不接受/);
  }
});
