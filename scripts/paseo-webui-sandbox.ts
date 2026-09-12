import { readFileSync } from 'node:fs';
import { inlineScriptHashes } from './content-security.ts';

/** Fixed upstream generated JSON literal only; never evaluate source code. */
export function mermaidSandboxHashes(source: string): string[] {
  const literal = source.match(/^export const mermaidRuntimeHtml = ("[^\n]*");\s*$/m)?.[1];
  if (!literal) throw new Error('Unknown generated Mermaid runtime format.');
  const html: unknown = JSON.parse(literal);
  if (typeof html !== 'string') throw new Error('Invalid Mermaid runtime HTML.');
  const hashes = inlineScriptHashes(html);
  if (hashes.length !== 1) throw new Error('Expected one fixed Mermaid sandbox script.');
  return hashes;
}

export function readMermaidSandboxHashes(path: string): string[] {
  return mermaidSandboxHashes(readFileSync(path, 'utf8'));
}
