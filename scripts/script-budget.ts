import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { getPaseoBuild } from '../src/features/paseo-webui/build-config.ts';
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

export interface AssistantBudgetInput {
  basePath: string;
  scripts: { path: string; sha256: string }[];
}
export function scriptBudget(
  scripts: Map<string, string>,
  pages: string[],
  assistant?: AssistantBudgetInput,
) {
  const nativePaths = new Set(assistant?.scripts.map((file) => file.path) ?? []);
  if (assistant) {
    if (
      !/^\/vendor\/paseo\/[a-f0-9]{16}$/.test(assistant.basePath) ||
      !nativePaths.size ||
      nativePaths.size !== assistant.scripts.length
    )
      throw new Error('Invalid assistant script inventory.');
    for (const file of assistant.scripts) {
      const source = scripts.get(file.path);
      if (
        !file.path.startsWith(assistant.basePath + '/') ||
        source === undefined ||
        createHash('sha256').update(source).digest('hex') !== file.sha256
      )
        throw new Error('Assistant script differs from its verified build.');
    }
    for (const path of scripts.keys())
      if (path.startsWith('/vendor/paseo/') && !nativePaths.has(path))
        throw new Error('Unknown assistant script outside the verified inventory.');
  }
  const isHost = (path: string) => Boolean(assistant) && /^\/_astro\/host\.[\w-]+\.js$/.test(path);
  const assistantRoots = new Set<string>();
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
  // Metro owns its native graph; count the complete verified inventory without
  // mistaking its private module format for ordinary ESM imports.
  const dependencies = new Map(
    [...scripts].map(([path, source]) => [path, nativePaths.has(path) ? [] : imports(source)]),
  );
  const mediaRoots = new Set<string>();
  function closure(roots: Set<string>, deferMedia = false) {
    const seen = new Set<string>();
    function visit(reference: string, importer = '/index.html') {
      const url = new URL(reference, `https://build.invalid${importer}`);
      if (url.origin !== 'https://build.invalid' || !url.pathname.endsWith('.js')) return;
      const path = decodeURIComponent(url.pathname);
      if (nativePaths.has(path))
        throw new Error('Native assistant script leaked into ordinary imports.');
      if (seen.has(path)) return;
      if (!scripts.has(path)) throw new Error(`Missing bundled script: ${path}`);
      seen.add(path);
      for (const target of dependencies.get(path)!) {
        const resolved = new URL(target.path, `https://build.invalid${path}`).pathname;
        // Only this reviewed lazy entry may use the media allowance. Static/preloaded
        // access still makes its complete dependency tree part of the common budget.
        if (isHost(resolved)) {
          if (!target.dynamic) throw new Error('Assistant host must remain dynamically imported.');
          assistantRoots.add(resolved);
        } else if (deferMedia && target.dynamic && /^\/_astro\/media\.[\w-]+\.js$/.test(resolved))
          mediaRoots.add(resolved);
        else visit(target.path, path);
      }
    }
    for (const root of roots) {
      if (isHost(root) && roots !== assistantRoots)
        throw new Error('Assistant host is statically loaded or preloaded.');
      visit(root);
    }
    return seen;
  }
  const common = closure(commonRoots, true);
  const mediaFiles = [...closure(mediaRoots)].filter((path) => !common.has(path));
  // The reviewed MIT game is fetched only by media-experience after an explicit click.
  // Count its complete script in the same allowance; other public JS stays common.
  if (mediaRoots.size && scripts.has('/media/2048/game.js') && !common.has('/media/2048/game.js'))
    mediaFiles.push('/media/2048/game.js');
  const islands = closure(islandRoots);
  const assistantClosure = closure(assistantRoots);
  // Shared host helpers remain charged to the ordinary page, including helpers
  // reached by MDX or media. Lazy classification must never hide shared bytes.
  for (const path of assistantClosure)
    if (islands.has(path) || mediaFiles.includes(path)) common.add(path);
  const assistantFiles = [...assistantClosure].filter((path) => !common.has(path));
  const islandFiles = [...islands].filter((path) => !common.has(path));
  const commonFiles = [...scripts.keys()].filter(
    (path) =>
      !islandFiles.includes(path) &&
      (!mediaFiles.includes(path) || common.has(path)) &&
      !assistantFiles.includes(path) &&
      !nativePaths.has(path),
  );
  const size = (values: string[]) =>
    values.reduce((total, value) => total + gzipSync(value).length, 0);
  return {
    classification: {
      common: commonFiles,
      media: mediaFiles.filter((path) => !common.has(path)),
      assistantHost: assistantFiles,
      assistantNative: [...nativePaths],
    },
    javascriptGzip: size(commonFiles.map((path) => scripts.get(path)!)) + size([...commonInline]),
    mediaJavascriptGzip: size(
      mediaFiles.filter((path) => !common.has(path)).map((path) => scripts.get(path)!),
    ),
    // Until per-profile first-open traces are bound, all native chunks count as
    // initial as well as total. This is conservative, never a claimed load win.
    assistantInitialJavascriptGzip: size(
      [...assistantFiles, ...nativePaths].map((path) => scripts.get(path)!),
    ),
    assistantTotalJavascriptGzip: size(
      [...assistantFiles, ...nativePaths].map((path) => scripts.get(path)!),
    ),
    mdxJavascriptGzip: Math.max(
      0,
      ...interactivePages.map(
        (page) =>
          size(
            [...closure(page.roots)]
              .filter((path) => !common.has(path))
              .map((path) => scripts.get(path)!),
          ) + size([...new Set(page.inline)].filter((body) => !commonInline.has(body))),
      ),
    ),
  };
}

export function measureScriptBudget(out: string) {
  const build = getPaseoBuild();
  const scripts = new Map<string, string>();
  const pages: string[] = [];
  function scan(directory: string, relative = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Budget output cannot contain symlinks.');
      const path = join(directory, entry.name);
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) scan(path, name);
      else if (name.endsWith('.js') && !name.startsWith('/pagefind/'))
        scripts.set(name, readFileSync(path, 'utf8'));
      else if (name.endsWith('.html') && !name.startsWith('/vendor/paseo/'))
        pages.push(readFileSync(path, 'utf8'));
    }
  }
  scan(out);
  if (!scripts.size || !pages.length) throw new Error('Build is missing scripts or HTML pages.');
  return scriptBudget(
    scripts,
    pages,
    build
      ? {
          basePath: build.config.basePath,
          scripts: build.files
            .filter((file) => file.path.endsWith('.js'))
            .map((file) => ({
              path: build.config.basePath + '/' + file.path,
              sha256: file.sha256,
            })),
        }
      : undefined,
  );
}
