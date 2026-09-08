import { createServer } from 'node:http';
import { connect } from 'node:net';
import { readFileSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const profile = process.env.PASEO_MOCK_PROFILE || 'H';
if (!['H', 'A1', 'A2'].includes(profile)) throw new Error('Unknown isolated fixture profile');
const root = resolve(`.scratch/paseo-webui/${profile.toLowerCase()}-site`);
const mime = {
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
};
const headers = readFileSync(resolve(root, '_headers'), 'utf8');
const csp = headers.match(/^ {2}Content-Security-Policy: (.+)$/m)?.[1];
if (!csp) throw new Error('Missing production CSP');
const server = createServer((req, res) => {
  try {
    let path = resolve(
      root,
      '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname),
    );
    if (!path.startsWith(root + sep)) throw new Error('Invalid path');
    if (statSync(path).isDirectory()) path = resolve(path, 'index.html');
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(readFileSync(path));
  } catch {
    res.writeHead(404);
    res.end('Fixture resource unavailable');
  }
});
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws') {
    socket.destroy();
    return;
  }
  const upstream = connect(6793, '127.0.0.1', () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${req.rawHeaders.reduce((s, v, i, a) => (i % 2 ? s : s + a[i] + ': ' + a[i + 1] + '\r\n'), '')}\r\n`,
    );
    if (head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  socket.on('close', () => upstream.destroy());
  upstream.on('close', () => socket.destroy());
});
server.listen(4393, '127.0.0.1', () =>
  console.log('Owned protocol-fixture host 4393 → mock-only daemon 6793; production CSP retained.'),
);
