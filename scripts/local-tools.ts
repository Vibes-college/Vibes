import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const localState = '.wrangler/project-local';
export const localConfig = 'wrangler.local.jsonc';
export const wrangler = 'node_modules/wrangler/bin/wrangler.js';

// 执行本地命令，并把失败传递给最外层 npm 命令。
export function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`命令失败：${command} ${args.join(' ')}`);
}

// 固定本地数据库配置，不允许调用方注入线上参数。
export function databaseArgs(action: 'migrate' | 'seed') {
  const command =
    action === 'migrate'
      ? ['d1', 'migrations', 'apply', 'DB']
      : ['d1', 'execute', 'DB', '--file', 'db/seed.sql'];
  return [...command, '--local', '--config', localConfig, '--persist-to', localState];
}

// 仅接受明确列出的命令，拒绝额外参数以避免误操作。
export function requireAction(args: string[], allowed: readonly string[]) {
  if (args.length !== 1 || !allowed.includes(args[0])) {
    throw new Error(`只允许：${allowed.join(' / ')}；不接受额外参数或 --remote。`);
  }
  return args[0];
}
