import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { searchPerformance, validateScale } from './search-performance.ts';

// 只为隔离测量服务实际静态产物；绑定系统分配的空闲端口，不启动大目录文件监视器。
export async function measurePreview(_root: string, output: string) {
  const base = resolve(output);
  const types: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
  };
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
      let file = resolve(base, '.' + pathname);
      if (!file.startsWith(base + '/')) throw new Error('Outside fixture');
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      const data = readFileSync(file);
      const compress = request.headers['accept-encoding']?.includes('gzip');
      response.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        ...(compress ? { 'Content-Encoding': 'gzip' } : {}),
        'Cache-Control':
          pathname.startsWith('/pagefind/') || pathname.startsWith('/_astro/')
            ? 'public, max-age=3600'
            : 'no-cache',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' data:",
      });
      response.end(compress ? gzipSync(data) : data);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No local test port');
  try {
    const origin = `http://127.0.0.1:${address.port}`;
    await validateScale(origin);
    return await searchPerformance(origin);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
}
