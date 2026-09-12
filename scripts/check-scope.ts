import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { checkMode } from './ci-policy.ts';
import { pathToFileURL } from 'node:url';

export type CheckScope = 'docs' | 'tools' | 'full';

// 只缩减明确无网页影响的路径；未知、空差异和CI自身变化保守地完整验证。
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
    if (/^(scripts|tests\/unit)\/docs-[a-z-]+(?:\.test)?\.ts$/.test(path)) {
      scope = 'tools';
      continue;
    }
    return 'full';
  }
  return scope;
}

// 以Git差异（含删除、改名前后及本地未提交文件）选择检查，基线不可读则完整验证。
export function changedScope(base: string, cwd = process.cwd()): CheckScope {
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
    return classifyChanges((changed + untracked).split('\0').filter(Boolean));
  } catch {
    return 'full';
  }
}

// main按已上线版本累计比较，避免旧代码发布被较新的纯文档提交挤掉后永远漏发。
export async function productionScope(cwd = process.cwd()): Promise<CheckScope> {
  try {
    const response = await fetch('https://vibes.college/__release.json?t=' + Date.now(), {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
    if (!response.ok) return 'full';
    const { sha } = (await response.json()) as { sha?: string };
    if (!sha || !/^[a-f0-9]{40}$/.test(sha)) return 'full';
    execFileSync('git', ['merge-base', '--is-ancestor', sha, 'HEAD'], { cwd, stdio: 'ignore' });
    return changedScope(sha, cwd);
  } catch {
    return 'full';
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope =
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
      ? 'full'
      : process.env.GITHUB_EVENT_NAME === 'push' && process.env.GITHUB_REF === 'refs/heads/main'
        ? await productionScope()
        : changedScope(process.env.CHECK_BASE_REF || 'origin/main');
  console.log(`检查范围：${scope}（docs=文档；tools=基础检查；full=完整验收和体积）`);
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
    appendFileSync(process.env.GITHUB_OUTPUT, `scope=${scope}\nmode=${mode}\n`);
  }
}
