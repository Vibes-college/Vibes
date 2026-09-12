import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parsePaseoAssetConfig } from '../src/features/paseo-webui/asset-contract.ts';
import { inlineScriptHashes } from './content-security.ts';
import { paseoPreviewHtml, paseoPreviewPath, paseoPreviewPolicy } from './paseo-webui-preview.ts';
import { artifactDigest, requirePages } from './release-utils.ts';

export interface ReleaseResponse {
  path: string;
  integrity: string;
  bytes: number;
  contentType: string;
  headers: Record<string, string | null>;
}
export interface ReleaseExpectations {
  digest: string;
  responses: ReleaseResponse[];
}
export const sri = (value: Buffer) =>
  'sha256-' + createHash('sha256').update(value).digest('base64');

export function normalizeHeader(name: string, value: string): string {
  if (name === 'content-security-policy')
    return value
      .split(';')
      .map((part) => part.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .sort()
      .join(';');
  if (name === 'cache-control')
    return value
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .sort()
      .join(',');
  return value.trim().toLowerCase();
}

// Match the reviewed _headers format, including removals for the isolated viewer.
function responseHeaders(source: string, path: string): Record<string, string> {
  const result: Record<string, string> = {};
  let applies = false;
  for (const line of source.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (line.startsWith('/')) {
      const pattern = line.trim();
      applies = pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern;
    } else if (applies) {
      const removal = line.match(/^\s+!\s+([\w-]+)\s*$/);
      const header = line.match(/^\s+([\w-]+):\s*(.+)$/);
      if (removal) delete result[removal[1].toLowerCase()];
      else if (header) result[header[1].toLowerCase()] = header[2];
      else throw new Error('Unsupported release header format');
    }
  }
  return result;
}

function nativeConfig(html: string) {
  const match = html.match(/\bdata-paseo-config="([^"]*)"/);
  if (!match) {
    if (html.includes('data-paseo-config')) throw new Error('Malformed native configuration');
    return null;
  }
  const entities: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&#39;': "'",
    '&lt;': '<',
    '&gt;': '>',
  };
  const config = parsePaseoAssetConfig(
    JSON.parse(match[1].replace(/&quot;|&amp;|&#39;|&lt;|&gt;/g, (key) => entities[key])),
  );
  if (!config) throw new Error('Invalid native asset configuration');
  return config;
}

function parentPolicy(html: string, headers: Record<string, string>): void {
  const csp = headers['content-security-policy'] || '';
  const script =
    csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('script-src '))
      ?.split(/\s+/)
      .slice(1) || [];
  if (
    !script.includes("'self'") ||
    script.includes("'unsafe-inline'") ||
    script.includes("'unsafe-eval'") ||
    !csp.includes("default-src 'self'") ||
    !csp.includes("frame-ancestors 'none'") ||
    inlineScriptHashes(html).some((hash) => !script.includes(hash))
  )
    throw new Error('Production parent CSP does not authorize only the reviewed scripts');
  if (headers['x-content-type-options'] !== 'nosniff' || headers['x-frame-options'] !== 'DENY')
    throw new Error('Missing production document security headers');
}

export function preflightRelease(directory = 'dist'): ReleaseExpectations {
  const root = realpathSync(directory);
  requirePages(root);
  const read = (path: string) => {
    const file = join(root, path.replace(/^\//, ''), path.endsWith('/') ? 'index.html' : '');
    if (realpathSync(file) !== file)
      throw new Error('Release resources cannot follow symbolic links');
    return readFileSync(file);
  };
  const headers = readFileSync(join(root, '_headers'), 'utf8');
  const responses: ReleaseResponse[] = [];
  const documents = ['/zh/', '/en/'].map((path) => ({ path, bytes: read(path) }));
  const configs = documents.map(({ path, bytes }) => {
    const html = bytes.toString('utf8');
    if (!html.includes('<html') || !html.includes('Vibes'))
      throw new Error('Missing usable bilingual page');
    const policy = responseHeaders(headers, path);
    parentPolicy(html, policy);
    responses.push({
      path,
      bytes: bytes.length,
      integrity: sri(bytes),
      contentType: 'text/html',
      headers: {
        'content-security-policy': policy['content-security-policy'],
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
      },
    });
    return nativeConfig(html);
  });
  if (JSON.stringify(configs[0]) !== JSON.stringify(configs[1]))
    throw new Error('Bilingual native configurations differ');
  const config = configs[0];
  if (config) {
    for (const asset of [config.script, ...config.styles]) {
      const bytes = read(asset.url);
      if (sri(bytes) !== asset.integrity) throw new Error('Native asset SRI integrity mismatch');
      const policy = responseHeaders(headers, asset.url);
      const cache = policy['cache-control'] || '';
      if (!cache.includes('immutable') || !cache.includes('public'))
        throw new Error('Native assets need immutable public caching');
      responses.push({
        path: asset.url,
        bytes: bytes.length,
        integrity: asset.integrity,
        contentType: asset.url.endsWith('.js') ? 'application/javascript' : 'text/css',
        headers: { 'x-content-type-options': 'nosniff', 'cache-control': cache },
      });
    }
    const carrier = read(paseoPreviewPath);
    const policy = responseHeaders(headers, paseoPreviewPath);
    if (
      carrier.toString('utf8') !== paseoPreviewHtml() ||
      normalizeHeader('content-security-policy', policy['content-security-policy'] || '') !==
        normalizeHeader('content-security-policy', paseoPreviewPolicy) ||
      policy['x-frame-options'] ||
      policy['cache-control'] !== 'no-store' ||
      policy['referrer-policy'] !== 'no-referrer'
    )
      throw new Error('HTML preview carrier or isolation policy differs');
    responses.push({
      path: paseoPreviewPath,
      bytes: carrier.length,
      integrity: sri(carrier),
      contentType: 'text/html',
      headers: {
        'content-security-policy': paseoPreviewPolicy,
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-frame-options': null,
      },
    });
  }
  return { digest: artifactDigest(root), responses };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = preflightRelease();
  console.log(
    `Production preflight passed: ${result.responses.length} responses, digest ${result.digest}`,
  );
}
