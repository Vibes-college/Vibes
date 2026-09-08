import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { bundleSandboxGame } from '../../scripts/sandbox-game.ts';

const template =
  '<link rel="stylesheet" href="/media/2048/game.css"><script src="/media/2048/game.js"></script>';

test('sandbox bundle preserves exact source bytes and authorizes only its executable', () => {
  const out = mkdtempSync(join(tmpdir(), 'vibes-sandbox-'));
  const root = join(out, 'media/2048');
  mkdirSync(root, { recursive: true });
  const script = 'window.example = "$&";\n';
  try {
    writeFileSync(join(root, 'game.txt'), template);
    writeFileSync(join(root, 'game.css'), 'body { color: red; }');
    writeFileSync(join(root, 'game.js'), script);
    assert.deepEqual(bundleSandboxGame(out), [
      `'sha256-${createHash('sha256').update(script).digest('base64')}'`,
    ]);
    const html = readFileSync(join(root, 'game-bundled.txt'), 'utf8');
    assert.equal(readFileSync(join(root, 'game.txt'), 'utf8'), template);
    assert.ok(html.includes(`<script>${script}</script>`));
    assert.ok(html.includes('<style>body { color: red; }</style>'));
    assert.doesNotMatch(html, /\b(?:src|href)=/);
    assert.equal(readFileSync(join(root, 'game.js'), 'utf8'), script);

    for (const unsafe of ['</script><script>unexpected()</script>', 'a'.repeat(65536)]) {
      writeFileSync(join(root, 'game.txt'), template);
      writeFileSync(join(root, 'game.js'), unsafe);
      assert.throws(() => bundleSandboxGame(out), /sources|64 KiB/);
      assert.equal(readFileSync(join(root, 'game.txt'), 'utf8'), template);
    }
    writeFileSync(join(root, 'game.txt'), template.replace('game.js', 'other.js'));
    writeFileSync(join(root, 'game.js'), script);
    assert.throws(() => bundleSandboxGame(out), /sources/);
    for (const addition of [
      '<script>console.log("extra executable")</script>',
      '<script src="/extra.js"></script>',
      '<link rel="stylesheet" href="/extra.css">',
      '<style>body { display: none; }</style>',
    ]) {
      writeFileSync(join(root, 'game.txt'), template + addition);
      assert.throws(() => bundleSandboxGame(out), /sources/);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
