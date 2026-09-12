import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, lstatSync, realpathSync, readFileSync } from 'node:fs';
import { checkMode } from './ci-policy.ts';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type CheckScope = 'docs' | 'tools' | 'content' | 'full';

// 路径只决定候选范围；内容还须检查语法，未知、空差异和CI变化完整验证。
export function classifyChanges(paths: string[]): CheckScope {
  if (!paths.length) return 'full';
  let scope: CheckScope = 'docs';
  for (const path of paths) {
    if (
      /^(docs|specs)\/.*\.md$/.test(path) ||
      /^(AGENTS|README)\.md$/.test(path) ||
      path === '.github/pull_request_template.md' ||
      path === 'resources/README.md' ||
      /^\.specify\/(memory|templates\/overrides)\/.*\.md$/.test(path) ||
      // Agent文案及原生流程声明不参与网站构建；同目录的脚本仍保守回退。
      /^\.agents\/skills\/[^/]+\/(?:SKILL\.md|references\/.+\.md)$/.test(path) ||
      /^\.specify\/presets\/[^/]+\/(?:preset\.ya?ml|commands\/[^/]+\.md|references\/.+\.md)$/.test(
        path,
      ) ||
      path === '.specify/presets/.registry' ||
      /^\.specify\/workflows\/(?:[^/]+\/workflow\.ya?ml|overlays\/[^/]+\/[^/]+\.ya?ml|workflow-registry\.json)$/.test(
        path,
      ) ||
      /^\.specify\/integrations\/[^/]+\.manifest\.json$/.test(path)
    )
      continue;
    if (
      /^src\/content\/works\/[a-z0-9-]+\/(?:work\.json|(?:zh|en)\.mdx?)$/.test(path) ||
      /^public\/media\/[a-z0-9-]+\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|avif|gif)$/.test(path)
    ) {
      if (scope === 'tools') return 'full';
      scope = 'content';
      continue;
    }
    if (/^(scripts|tests\/unit)\/docs-[a-z-]+(?:\.test)?\.ts$/.test(path)) {
      if (scope === 'content') return 'full';
      scope = 'tools';
      continue;
    }
    return 'full';
  }
  return scope;
}

// 以Git差异（含删除、改名前后及本地未提交文件）选择检查，基线不可读则完整验证。
export function changedScope(base: string, cwd = process.cwd(), inspectContent = true): CheckScope {
  try {
    const commit = execFileSync(
      'git',
      ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`],
      { cwd, encoding: 'utf8' },
    ).trim();
    const changed = execFileSync(
      'git',
      ['diff', '--no-renames', '--name-only', '-z', commit, '--'],
      { cwd, encoding: 'utf8' },
    );
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], {
      cwd,
      encoding: 'utf8',
    });
    const paths = (changed + untracked).split('\0').filter(Boolean);
    const scope = classifyChanges(paths);
    if (scope !== 'content' || !inspectContent) return scope;
    // Symlinks and missing parser dependencies conservatively require full verification.
    if (
      paths.some(
        (path) =>
          existsSync(`${cwd}/${path}`) &&
          (lstatSync(`${cwd}/${path}`).isSymbolicLink() ||
            realpathSync(`${cwd}/${path}`) !== `${realpathSync(cwd)}/${path}`),
      )
    )
      return 'full';
    const previousPaths = new Set(
      execFileSync(
        'git',
        ['ls-tree', '-r', '--name-only', '-z', commit, '--', 'src/content/works/'],
        { cwd, encoding: 'utf8' },
      ).split('\0'),
    );
    execFileSync(
      process.execPath,
      [
        '--experimental-strip-types',
        fileURLToPath(new URL('./content-policy.ts', import.meta.url)),
      ],
      {
        cwd,
        input: JSON.stringify(
          paths
            .filter((path) => /\.mdx?$/.test(path) && path.startsWith('src/content/'))
            .flatMap((path) => {
              const versions: { source: string; format: 'md' | 'mdx' }[] = [];
              const format = path.endsWith('.mdx') ? 'mdx' : 'md';
              if (existsSync(`${cwd}/${path}`))
                versions.push({ source: readFileSync(`${cwd}/${path}`, 'utf8'), format });
              if (previousPaths.has(path)) {
                const previous = execFileSync('git', ['show', `${commit}:${path}`], {
                  cwd,
                  encoding: 'utf8',
                  stdio: ['ignore', 'pipe', 'pipe'],
                });
                versions.push({ source: previous, format });
              }
              return versions;
            }),
        ),
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    return 'content';
  } catch {
    return 'full';
  }
}

// main按已上线版本累计比较，避免旧代码发布被较新的纯文档提交挤掉后永远漏发。
export async function productionBase(cwd = process.cwd()): Promise<string> {
  try {
    const response = await fetch('https://vibes.college/__release.json?t=' + Date.now(), {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
    if (!response.ok) return 'unavailable-production-base';
    const { sha } = (await response.json()) as { sha?: string };
    if (!sha || !/^[a-f0-9]{40}$/.test(sha)) return 'unavailable-production-base';
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd, stdio: 'ignore' });
    return sha;
  } catch {
    return 'unavailable-production-base';
  }
}

export async function productionScope(cwd = process.cwd()): Promise<CheckScope> {
  return changedScope(await productionBase(cwd), cwd);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pathsOnly = process.argv[2] === '--paths-only';
  if (process.argv.length > (pathsOnly ? 3 : 2)) throw new Error('Usage: ci:scope [--paths-only]');
  const base =
    process.env.CHECK_RESOLVED_BASE ||
    (process.env.GITHUB_EVENT_NAME === 'push' && process.env.GITHUB_REF === 'refs/heads/main'
      ? await productionBase()
      : process.env.CHECK_BASE_REF || 'origin/main');
  const scope =
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
      ? 'full'
      : changedScope(base, process.cwd(), !pathsOnly);
  console.log(
    `检查范围：${scope}（docs=文档；tools=基础检查；content=内容验收和体积；full=完整验收和体积）`,
  );
  if (process.env.GITHUB_OUTPUT) {
    const event = process.env.GITHUB_EVENT_PATH
      ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
      : {};
    const mode = checkMode({
      name: process.env.GITHUB_EVENT_NAME || '',
      ref: process.env.GITHUB_REF || '',
      draft: event.pull_request?.draft === true,
    });
    if (mode === 'none') throw new Error('Unsupported CI event');
    appendFileSync(process.env.GITHUB_OUTPUT, `scope=${scope}\nmode=${mode}\nbase=${base}\n`);
  }
}
