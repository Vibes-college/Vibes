import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const paseoPreviewPath = '/paseo-preview/';
// Match the fixed upstream's self-contained HTML policy. Only this opaque-origin
// response may run a file's inline/eval scripts; the Explore response stays strict.
export const paseoPreviewPolicy = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  'font-src data:',
  'media-src data: blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  'sandbox allow-scripts',
  "frame-ancestors 'self'",
].join('; ');

export function paseoPreviewHtml() {
  const script = readFileSync(
    new URL('../src/features/paseo-webui/preview-carrier.js', import.meta.url),
    'utf8',
  );
  if (/<\/script/i.test(script)) throw new Error('Unexpected HTML delimiter in preview carrier.');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Local HTML preview</title></head><body><script>${script}</script></body></html>\n`;
}

export function writePaseoPreview(out: string) {
  const directory = join(out, paseoPreviewPath.slice(1));
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'index.html'), paseoPreviewHtml());
}

export function withPaseoPreview(headers: string) {
  if (!headers.includes('frame-src https://')) throw new Error('Unknown parent framing policy.');
  // Other same-origin pages retain frame-ancestors none and X-Frame-Options DENY.
  // A relative CSP path cannot work across local, preview and production origins.
  return (
    headers.replace('frame-src https://', "frame-src 'self' https://") +
    `\n${paseoPreviewPath}*\n` +
    '  ! Content-Security-Policy\n  ! X-Frame-Options\n  ! Cache-Control\n  ! Referrer-Policy\n' +
    `  Content-Security-Policy: ${paseoPreviewPolicy}\n` +
    '  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n'
  );
}
