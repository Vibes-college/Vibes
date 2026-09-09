import { withPaseoPreview } from './paseo-webui-preview.ts';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// A static hash authorizes only this exact build output. Never enable unsafe-inline.
export function inlineScripts(html: string): string[] {
  const scripts: string[] = [];
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/i.test(attributes)) continue;
    const type = attributes.match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1];
    if (
      type &&
      !['module', 'text/javascript', 'application/javascript'].includes(type.toLowerCase())
    )
      continue;
    if (body.trim()) scripts.push(body);
  }
  return scripts;
}

export function inlineScriptHashes(html: string): string[] {
  return [
    ...new Set(
      inlineScripts(html).map(
        (body) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
      ),
    ),
  ].sort();
}

export function withScriptHashes(headers: string, hashes: string[]): string {
  if (!/script-src 'self' 'wasm-unsafe-eval'(?=;)/.test(headers))
    throw new Error('Expected the reviewed same-origin script policy in build _headers.');
  return headers.replace(
    "script-src 'self' 'wasm-unsafe-eval'",
    ["script-src 'self' 'wasm-unsafe-eval'", ...new Set(hashes)].join(' '),
  );
}

export function withPaseoRuntime(headers: string): string {
  if (!/connect-src 'self'(?=;)/.test(headers))
    throw new Error('Expected the reviewed same-origin connection policy.');
  if (!/script-src 'self' 'wasm-unsafe-eval'(?=;| 'sha256-)/.test(headers))
    throw new Error('Expected the reviewed same-origin script policy.');
  if (!headers.includes("img-src 'self' data: https:;"))
    throw new Error('Expected the reviewed image policy.');
  if (!headers.includes("font-src 'self';") || headers.includes('worker-src '))
    throw new Error('Expected the reviewed worker fallback policy.');
  // Native Web accepts user-configured direct/relay hosts, and attachments may
  // be fetched from data/blob URLs. Browser mixed-content and origin checks stay
  // in force. Installed plugins retain upstream's same-realm trust model.
  return (
    headers
      .replace("connect-src 'self';", "connect-src 'self' ws: wss: http: https: data: blob:;")
      .replace("script-src 'self' 'wasm-unsafe-eval'", "script-src 'self' 'wasm-unsafe-eval' blob:")
      .replace("img-src 'self' data: https:;", "img-src 'self' data: blob: https:;")
      // Workers previously inherited script-src self; plugin blobs must not also
      // expand that separate capability through CSP's worker fallback chain.
      .replace("font-src 'self';", "font-src 'self'; worker-src 'self';")
  );
}

export function writeContentSecurity(out: string, sandboxHashes: string[] = [], assistant = false) {
  const hashes = new Set<string>(sandboxHashes);
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (path !== join(out, 'paseo-preview')) scan(path);
      } else if (entry.name.endsWith('.html'))
        for (const hash of inlineScriptHashes(readFileSync(path, 'utf8'))) hashes.add(hash);
    }
  }
  scan(out);
  // ClientRouter retains the first document's response policy. Use the same finite
  // hash set on every route so navigating from plain Markdown can initialize islands.
  const path = join(out, '_headers');
  const base = readFileSync(path, 'utf8');
  const strict = withScriptHashes(base, [...hashes].sort());
  writeFileSync(path, assistant ? withPaseoPreview(withPaseoRuntime(strict)) : strict);
  console.log(`CSP: authorized ${hashes.size} exact inline script hashes from this build.`);
}
