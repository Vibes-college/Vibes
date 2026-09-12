import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Plugin } from 'vite';
import { getPaseoBuild } from '../src/features/paseo-webui/build-config.ts';
import { paseoPreviewHtml, paseoPreviewPath, paseoPreviewPolicy } from './paseo-webui-preview.ts';

const mime: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.map': 'application/json',
};

export function paseoDevAssets(): Plugin {
  return {
    name: 'paseo-verified-dev-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url || '/', 'http://dev.invalid').pathname;
        if (!path.startsWith('/vendor/paseo/') && !path.startsWith('/paseo-preview')) return next();
        try {
          const build = getPaseoBuild();
          if (!build) {
            response.writeHead(404).end();
            return;
          }
          response.setHeader('X-Content-Type-Options', 'nosniff');
          response.setHeader('Cache-Control', 'no-store');
          if (path === paseoPreviewPath) {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.setHeader('Content-Security-Policy', paseoPreviewPolicy);
            response.setHeader('Referrer-Policy', 'no-referrer');
            response.setHeader('X-Robots-Tag', 'noindex');
            response.end(paseoPreviewHtml());
            return;
          }
          const name = path.startsWith(build.config.basePath + '/')
            ? path.slice(build.config.basePath.length + 1)
            : '';
          const file = build.files.find((item) => item.path === name);
          if (!file) {
            response.writeHead(404).end();
            return;
          }
          response.setHeader(
            'Content-Type',
            name === 'PASEO-LICENSE'
              ? 'text/plain; charset=utf-8'
              : mime[extname(name)] || 'application/octet-stream',
          );
          response.end(readFileSync(join(build.directory, name)));
        } catch {
          response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Native assistant artifact is missing or stale. Run npm run paseo:build.');
        }
      });
    },
  };
}
