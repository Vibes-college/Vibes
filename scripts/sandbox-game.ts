import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inlineScriptHashes } from './content-security.ts';

// Avoid subresource requests from the opaque origin: some browser network paths
// reject them. srcdoc inherits CSP, so authorize only this game's exact bytes.
export function bundleSandboxGame(out: string): string[] {
  const root = join(out, 'media/2048');
  const path = join(root, 'game.txt');
  const template = readFileSync(path, 'utf8');
  const css = readFileSync(join(root, 'game.css'), 'utf8');
  const script = readFileSync(join(root, 'game.js'), 'utf8');
  const stylesheet = '<link rel="stylesheet" href="/media/2048/game.css">';
  const executable = '<script src="/media/2048/game.js"></script>';
  if (
    template.split(stylesheet).length !== 2 ||
    template.split(executable).length !== 2 ||
    (template.match(/<script\b/gi) || []).length !== 1 ||
    (template.match(/<link\b/gi) || []).length !== 1 ||
    /<style\b/i.test(template) ||
    /<\/style\b/i.test(css) ||
    /<\/script\b/i.test(script)
  )
    throw new Error('Unexpected sandbox game sources; review before bundling.');
  const html = template
    .replace(stylesheet, () => `<style>${css}</style>`)
    .replace(executable, () => `<script>${script}</script>`);
  if (Buffer.byteLength(html) > 65536) throw new Error('Sandbox game exceeds 64 KiB.');
  // Preserve the old template URL for already-open clients with the 20 KB contract.
  writeFileSync(join(root, 'game-bundled.txt'), html);
  return inlineScriptHashes(html);
}
