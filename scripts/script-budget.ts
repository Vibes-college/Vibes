import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { inlineScripts } from './content-security.ts';

// Parse emitted JS with the existing TypeScript dependency, including dynamic imports.
// A chunk shared with ordinary scripts stays in the original budget, not the island allowance.
function imports(source: string): { path: string; dynamic: boolean }[] {
  const targets: { path: string; dynamic: boolean }[] = [];
  const tree = ts.createSourceFile(
    'bundle.js',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  function visit(node: ts.Node) {
    const value =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : undefined;
    if (value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)))
      targets.push({ path: value.text, dynamic: ts.isCallExpression(node) });
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return targets;
}

export function scriptBudget(scripts: Map<string, string>, pages: string[]) {
  const commonRoots = new Set<string>();
  const islandRoots = new Set<string>();
  const interactivePages: { roots: Set<string>; inline: string[] }[] = [];
  const commonInline = new Set<string>();
  const attribute = (tag: string, name: string) =>
    tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
  for (const html of pages) {
    const islands = [...html.matchAll(/<astro-island\b[^>]*>/gi)];
    const roots = islands.length ? new Set<string>() : commonRoots;
    for (const [tag] of islands)
      for (const name of ['component-url', 'renderer-url']) {
        const path = attribute(tag, name);
        if (path) {
          islandRoots.add(path);
          roots.add(path);
        }
      }
    for (const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
      const path = /^<script/i.test(tag)
        ? attribute(tag, 'src')
        : attribute(tag, 'rel') === 'modulepreload'
          ? attribute(tag, 'href')
          : undefined;
      if (path) roots.add(path);
    }
    for (const body of inlineScripts(html)) {
      if (!islands.length) commonInline.add(body);
      for (const path of imports(body)) roots.add(path.path);
    }
    if (islands.length) {
      for (const root of roots) islandRoots.add(root);
      interactivePages.push({ roots, inline: inlineScripts(html) });
    }
  }
  const dependencies = new Map([...scripts].map(([path, source]) => [path, imports(source)]));
  const mediaRoots = new Set<string>();
  const assistantRoots = new Set<string>();
  function closure(roots: Set<string>, deferEnhancements = false) {
    const seen = new Set<string>();
    function visit(reference: string, importer = '/index.html') {
      const url = new URL(reference, `https://build.invalid${importer}`);
      if (url.origin !== 'https://build.invalid' || !url.pathname.endsWith('.js')) return;
      const path = decodeURIComponent(url.pathname);
      if (seen.has(path)) return;
      if (!scripts.has(path)) throw new Error(`Missing bundled script: ${path}`);
      seen.add(path);
      for (const target of dependencies.get(path)!) {
        const resolved = new URL(target.path, `https://build.invalid${path}`).pathname;
        // Only this reviewed lazy entry may use the media allowance. Static/preloaded
        // access still makes its complete dependency tree part of the common budget.
        if (deferEnhancements && target.dynamic && /^\/_astro\/media\.[\w-]+\.js$/.test(resolved))
          mediaRoots.add(resolved);
        else if (
          deferEnhancements &&
          target.dynamic &&
          /^\/_astro\/assistant\.[\w-]+\.js$/.test(resolved)
        )
          assistantRoots.add(resolved);
        else visit(target.path, path);
      }
    }
    for (const root of roots) visit(root);
    return seen;
  }
  const common = closure(commonRoots, true);
  const mediaFiles = [...closure(mediaRoots)].filter((path) => !common.has(path));
  // The reviewed MIT game is fetched only by media-experience after an explicit click.
  // Count its complete script in the same allowance; other public JS stays common.
  if (mediaRoots.size && scripts.has('/media/2048/game.js') && !common.has('/media/2048/game.js'))
    mediaFiles.push('/media/2048/game.js');
  const islands = closure(islandRoots, true);
  const assistantFiles = [...closure(assistantRoots)].filter((path) => !common.has(path));
  const islandFiles = [...islands].filter((path) => !common.has(path));
  const commonFiles = [...scripts.keys()].filter(
    (path) =>
      !islandFiles.includes(path) && !mediaFiles.includes(path) && !assistantFiles.includes(path),
  );
  const size = (values: string[]) =>
    values.reduce((total, value) => total + gzipSync(value).length, 0);
  return {
    javascriptGzip: size(commonFiles.map((path) => scripts.get(path)!)) + size([...commonInline]),
    mediaJavascriptGzip: size(mediaFiles.map((path) => scripts.get(path)!)),
    assistantJavascriptGzip: size(assistantFiles.map((path) => scripts.get(path)!)),
    mdxJavascriptGzip: Math.max(
      0,
      ...interactivePages.map(
        (page) =>
          size(
            [...closure(page.roots, true)]
              .filter((path) => !common.has(path))
              .map((path) => scripts.get(path)!),
          ) + size([...new Set(page.inline)].filter((body) => !commonInline.has(body))),
      ),
    ),
  };
}

export function measureScriptBudget(out: string) {
  const scripts = new Map<string, string>();
  const pages: string[] = [];
  function scan(directory: string, relative = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) scan(path, name);
      else if (name.endsWith('.js') && !name.startsWith('/pagefind/'))
        scripts.set(name, readFileSync(path, 'utf8'));
      else if (name.endsWith('.html')) pages.push(readFileSync(path, 'utf8'));
    }
  }
  scan(out);
  if (!scripts.size || !pages.length) throw new Error('Build is missing scripts or HTML pages.');
  return scriptBudget(scripts, pages);
}
