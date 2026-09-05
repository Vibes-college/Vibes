import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { localConfig, localState, requireAction, root, run, wrangler } from './local-tools.ts';

requireAction(['e2e', ...process.argv.slice(2)], ['e2e']);

// 用户确认的云端测试路径：GitHub CI 使用 Playwright，本地仍使用 ego-browser。
if (process.env.GITHUB_ACTIONS === 'true' && process.env.CI === 'true') {
  console.log('GitHub CI：使用 Playwright Chromium 验收；本地仍使用 ego-browser。');
  run('npm', ['run', 'build']);
  run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test']);
  process.exit(0);
}

// 确认专用端口空闲，避免误测其他任务已经启动的网站。
async function assertPortAvailable() {
  const probe = createServer();
  probe.listen(4322, '127.0.0.1');
  await once(probe, 'listening');
  await new Promise<void>((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
}

await assertPortAvailable();
run('npm', ['run', 'build']);
const server = spawn(
  process.execPath,
  [
    wrangler,
    'dev',
    '--local',
    '--config',
    localConfig,
    '--persist-to',
    localState,
    '--ip',
    '127.0.0.1',
    '--port',
    '4322',
  ],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true },
);
server.stdout.on('data', (chunk) => process.stdout.write(chunk));
server.stderr.on('data', (chunk) => process.stderr.write(chunk));
let browser: ReturnType<typeof spawn> | undefined;

// 关闭本次测试启动的进程组，避免测试结束后遗留服务器。
function stop() {
  browser?.kill('SIGTERM');
  if (server.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
  }
}

// 中断也必须返回失败，并清理测试服务器。
function interrupt() {
  stop();
  process.exit(130);
}
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Cloudflare 本地服务启动失败。');
    try {
      const response = await fetch('http://127.0.0.1:4322/', { signal: AbortSignal.timeout(500) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* 服务仍在启动，稍后重试。 */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('等待本地 Cloudflare 服务超时。');
  browser = spawn('bash', ['scripts/ego-e2e.sh'], { cwd: root, stdio: 'inherit' });
  const timeout = setTimeout(() => browser?.kill('SIGTERM'), 180_000);
  try {
    const [code] = await once(browser, 'exit');
    if (code !== 0) throw new Error('ego-browser 端到端测试失败或超时。');
  } finally {
    clearTimeout(timeout);
  }
  console.log('端到端验收通过。');
} finally {
  stop();
}
