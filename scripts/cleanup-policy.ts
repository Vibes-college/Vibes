import { realpathSync } from 'node:fs';
import { sep } from 'node:path';

export type CleanupState = {
  merged: boolean;
  branch: string;
  prHead: string;
  branchHead: string;
  deployed: boolean;
  mergeInDeployment: boolean;
  dirty: boolean;
  idle: boolean;
  dependentPrs: number;
};

// 只清理已合并且已上线的同一分支，拒绝额外提交、脏工作区或仍被占用的资源。
export function requireCleanup(state: CleanupState): void {
  if (!state.merged || !state.deployed || !state.mergeInDeployment)
    throw new Error('Cleanup requires a merged PR and verified successful production deployment');
  if (
    !state.branch.startsWith('codex/') ||
    state.branch === 'main' ||
    state.branchHead !== state.prHead
  )
    throw new Error('Branch is outside scope or contains additional commits');
  if (state.dependentPrs > 0) throw new Error('Other open PRs still depend on this branch');
  if (state.dirty || !state.idle) throw new Error('Preserve dirty or occupied worktrees');
}

// 只允许可重建缓存随worktree删除；被Git忽略的秘密、证据和个人文件仍须保留。
export function protectedIgnored(paths: string[]): string[] {
  return paths.filter((path) => !/^(node_modules|dist|\.astro|test-results)\//.test(path));
}

// 解析真实路径后拒绝当前目录及其子目录，符号链接不能绕过保护。
export function isInside(directory: string, cwd: string): boolean {
  const target = realpathSync(directory);
  const current = realpathSync(cwd);
  return current === target || current.startsWith(target + sep);
}
