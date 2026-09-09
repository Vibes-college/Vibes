import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  createReadStream,
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { connect, createServer as createProbe, type Socket } from 'node:net';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fixtureHeadersForPath, parseFixtureHeaders } from './headers.ts';

// Playwright owns both listeners. This fixture never pairs with a user's daemon
// or inherits provider credentials; native mock agents exercise the real protocol.
const sitePort = 4396;
const daemonPort = 6796;
const source = resolve('.scratch/paseo-webui/upstream');
const output = realpathSync('dist');
const headerRules = parseFixtureHeaders(readFileSync(resolve(output, '_headers'), 'utf8'));
if (!fixtureHeadersForPath(headerRules, '/zh/')['content-security-policy'])
  throw new Error('Missing built production CSP.');
const supervisor = resolve(source, 'packages/server/dist/scripts/supervisor-entrypoint.js');
if (!existsSync(supervisor)) throw new Error('Build the fixed Paseo server before browser tests.');
const manifest = await import(
  pathToFileURL(resolve(source, 'packages/protocol/dist/provider-manifest.js')).href
);
const providers = manifest.AGENT_PROVIDER_DEFINITIONS as { id: string }[];
if (!providers.length) throw new Error('Missing official provider manifest.');
for (const port of [sitePort, daemonPort]) {
  const probe = createProbe();
  probe.listen(port, '127.0.0.1');
  await once(probe, 'listening');
  await new Promise<void>((done, reject) =>
    probe.close((error) => (error ? reject(error) : done())),
  );
}
const runs = resolve('.scratch/paseo-webui/test-runs');
mkdirSync(runs, { recursive: true, mode: 0o700 });
const runDirectory = mkdtempSync(resolve(runs, 'run-'));
const paseoHome = resolve(runDirectory, 'paseo');
const fixtureUserHome = resolve(runDirectory, 'user');
mkdirSync(paseoHome, { mode: 0o700 });
mkdirSync(fixtureUserHome, { mode: 0o700 });
writeFileSync(
  resolve(paseoHome, 'config.json'),
  JSON.stringify({
    version: 1,
    agents: { providers: Object.fromEntries(providers.map(({ id }) => [id, { enabled: false }])) },
  }),
  { mode: 0o600 },
);
const env = Object.fromEntries(
  ['PATH', 'USER', 'TMPDIR', 'SHELL', 'LANG'].flatMap((key) =>
    process.env[key] ? [[key, process.env[key]!]] : [],
  ),
);
Object.assign(env, {
  // Chat prepares ~/Vibes through the real daemon. Isolating PASEO_HOME alone
  // would still let this test create a directory in the developer's real home.
  HOME: fixtureUserHome,
  PASEO_HOME: paseoHome,
  PASEO_NODE_ENV: 'development',
  PASEO_LISTEN: `127.0.0.1:${daemonPort}`,
  PASEO_WEB_UI_ENABLED: 'false',
  PASEO_RELAY_ENABLED: 'false',
  PASEO_DICTATION_ENABLED: 'false',
  PASEO_VOICE_MODE_ENABLED: 'false',
});
const log = openSync(resolve(runDirectory, 'startup.log'), 'a', 0o600);
const child = spawn(process.execPath, [supervisor], {
  cwd: source,
  env,
  detached: true,
  stdio: ['ignore', log, log],
});
closeSync(log);
const sockets = new Set<Socket>();
let stopping = false;
let serverId = '';
const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
};
const server = createServer((request, response) => {
  try {
    const pathname = new URL(request.url || '/', `http://localhost:${sitePort}`).pathname;
    if (pathname === '/__paseo-fixture') {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ serverId, daemonPort, providers: 'mock-only' }));
      return;
    }
    let file = resolve(output, '.' + decodeURIComponent(pathname));
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    file = realpathSync(file);
    if (!file.startsWith(output + sep)) throw new Error('Outside fixture output.');
    response.writeHead(
      200,
      fixtureHeadersForPath(headerRules, pathname, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
      }),
    );
    createReadStream(file)
      .on('error', () => response.destroy())
      .pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Fixture resource unavailable');
  }
});
server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws') {
    socket.destroy();
    return;
  }
  const upstream = connect(daemonPort, '127.0.0.1', () => {
    const headers = request.rawHeaders.reduce(
      (result, value, index, all) =>
        index % 2 ? result : result + value + ': ' + all[index + 1] + '\r\n',
      '',
    );
    upstream.write(
      `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n${headers}\r\n`,
    );
    if (head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  for (const current of [socket, upstream]) {
    sockets.add(current as Socket);
    current.on('close', () => {
      sockets.delete(current as Socket);
      socket.destroy();
      upstream.destroy();
    });
    current.on('error', () => {
      socket.destroy();
      upstream.destroy();
    });
  }
});
async function stop(code: number) {
  if (stopping) return;
  stopping = true;
  server.close();
  server.closeAllConnections();
  for (const socket of sockets) socket.destroy();
  if (child.exitCode === null && child.signalCode === null && child.pid) {
    child.kill('SIGTERM');
    // The isolated supervisor owns its child process group. Escalation cannot
    // target another service and is only used if graceful shutdown stalls.
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid!, 'SIGKILL');
      } catch {
        /* Already exited. */
      }
    }, 12_000);
    await once(child, 'exit');
    clearTimeout(timer);
  }
  process.exit(code);
}
process.on('SIGTERM', () => void stop(0));
process.on('SIGINT', () => void stop(0));
child.on('exit', () => {
  if (!stopping) void stop(1);
});
child.on('error', () => {
  console.error('Could not start the isolated mock daemon.');
  void stop(1);
});
try {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const health = await fetch(`http://127.0.0.1:${daemonPort}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      if (health.ok) {
        serverId = readFileSync(resolve(paseoHome, 'server-id'), 'utf8').trim();
        break;
      }
    } catch {
      /* Startup is bounded and failure retains the private log. */
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  if (!serverId) throw new Error('Isolated mock daemon did not become ready.');
  server.listen(sitePort, '127.0.0.1');
  await once(server, 'listening');
  console.log(`Paseo mock-only fixture ready on localhost:${sitePort}; production CSP retained.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Fixture startup failed.');
  await stop(1);
}
