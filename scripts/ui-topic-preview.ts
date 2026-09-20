import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resources } from '../src/features/ui-topic/catalog.ts';
import { inlineScriptHashes, inlineScripts } from './content-security.ts';

export const uiPreviewDirectory = 'ui-topic/previews';

export function uiPreviewPolicy(html: string): string {
  if (
    inlineScripts(html).length !== 1 ||
    /<script\b[^>]*\bsrc\s*=/i.test(html) ||
    /\son\w+\s*=/i.test(html)
  )
    throw new Error('UI previews require one reviewed inline controller and no event attributes.');
  return [
    "default-src 'none'",
    `script-src ${inlineScriptHashes(html).join(' ')}`,
    "style-src 'unsafe-inline'",
    'img-src data:',
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    'sandbox allow-scripts',
    "frame-ancestors 'self'",
  ].join('; ');
}

// These fixed examples are separate responses, including when opened directly.
// Never add their controller hashes to the Explore page's script policy.
export function secureUiTopicPreviews(out: string): void {
  const directory = join(out, uiPreviewDirectory);
  const expected = resources.map((resource) => resource.id).sort();
  const entries = readdirSync(directory, { withFileTypes: true });
  if (
    entries.some((entry) => !entry.isDirectory() || entry.isSymbolicLink()) ||
    JSON.stringify(entries.map((entry) => entry.name).sort()) !== JSON.stringify(expected)
  )
    throw new Error('UI preview inventory differs from the reviewed source catalog.');
  const path = join(out, '_headers');
  let headers = readFileSync(path, 'utf8');
  if (!headers.includes("frame-src 'self'")) {
    if (!headers.includes('frame-src https://')) throw new Error('Unknown parent frame policy.');
    headers = headers.replace('frame-src https://', "frame-src 'self' https://");
  }
  for (const resource of resources) {
    const files = readdirSync(join(directory, resource.id), { withFileTypes: true });
    if (files.length !== 1 || files[0].name !== 'index.html' || !files[0].isFile())
      throw new Error('UI preview must contain only its fixed index.html.');
    const file = join(out, resource.previewSrc, 'index.html');
    const html = readFileSync(file, 'utf8');
    const policy = uiPreviewPolicy(html);
    // sandbox/frame-ancestors are HTTP-only; avoid ineffective meta directives.
    const meta = policy.split('; ').filter((part) => !/^(sandbox|frame-ancestors)\b/.test(part));
    const updated = html.replace(
      /(<meta http-equiv="Content-Security-Policy" content=")[^"]*(">)/,
      `$1${meta.join('; ')}$2`,
    );
    if (updated === html && !html.includes(meta.join('; ')))
      throw new Error('Missing UI preview meta policy.');
    writeFileSync(file, updated);
    headers +=
      `\n${resource.previewSrc}\n` +
      '  ! Content-Security-Policy\n  ! X-Frame-Options\n  ! Cache-Control\n  ! Referrer-Policy\n' +
      `  Content-Security-Policy: ${policy}\n` +
      '  Cache-Control: no-cache\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n';
  }
  writeFileSync(path, headers);
}
