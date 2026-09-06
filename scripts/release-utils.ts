import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const repository = 'Vibes-college/Vibes';

// 参数数组隔离命令与数据；凭据通过环境或stdin传递，不打印环境。
export function capture(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  return result.stdout;
}

// 只通过已授权的GitHub CLI读取明确仓库资源。
export function github(path: string): unknown {
  return JSON.parse(capture('gh', ['api', `repos/${repository}/${path}`]));
}

// 摘要包括相对路径和字节，拒绝符号链接，防止验收产物与上传内容不一致。
export function artifactDigest(directory: string, prefix = ''): string {
  const hash = createHash('sha256');
  for (const name of readdirSync(join(directory, prefix), { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(prefix, name.name);
    if (path === '__release.json') continue;
    if (name.isSymbolicLink()) throw new Error('Release assets cannot contain symlinks');
    hash.update(path + '\0');
    if (name.isDirectory()) hash.update(artifactDigest(directory, path));
    else {
      const bytes = readFileSync(join(directory, path));
      hash.update(String(bytes.length) + '\0').update(bytes);
    }
  }
  return hash.digest('hex');
}

// 要求预期首页存在，读取大小用于线上页面基本完整性检查。
export function requirePages(directory = 'dist'): void {
  for (const page of ['index.html', 'zh/index.html', 'en/index.html']) {
    if (statSync(join(directory, page)).size < 100) throw new Error(`Missing usable page: ${page}`);
  }
}
