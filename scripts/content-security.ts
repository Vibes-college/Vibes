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

export function writeContentSecurity(out: string, sandboxHashes: string[] = []) {
  const hashes = new Set<string>(sandboxHashes);
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (entry.name.endsWith('.html'))
        for (const hash of inlineScriptHashes(readFileSync(path, 'utf8'))) hashes.add(hash);
    }
  }
  scan(out);
  // ClientRouter retains the first document's response policy. Use the same finite
  // hash set on every route so navigating from plain Markdown can initialize islands.
  const path = join(out, '_headers');
  writeFileSync(path, withScriptHashes(readFileSync(path, 'utf8'), [...hashes].sort()));
  console.log(`CSP: authorized ${hashes.size} exact inline script hashes from this build.`);
}
