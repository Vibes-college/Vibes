import { readLimited } from './lib/media/read.ts';

interface Assets {
  fetch(request: Request): Promise<Response>;
}

const limit = 2 * 1024 * 1024;

export default {
  async fetch(request: Request, env: { ASSETS: Assets }): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (
      !path.startsWith('/great-ui/media/') ||
      !path.endsWith('.mp4') ||
      !['GET', 'HEAD'].includes(request.method)
    )
      return env.ASSETS.fetch(request);

    // Read only the same site's registered static asset. The Assets backend
    // ignores Range, so obtain its complete response before slicing a range.
    const incoming = new Headers(request.headers);
    incoming.delete('range');
    incoming.delete('if-range');
    incoming.set('accept-encoding', 'identity');
    const asset = await env.ASSETS.fetch(new Request(request, { headers: incoming }));
    if (asset.status !== 200 || asset.headers.get('content-type')?.split(';')[0] !== 'video/mp4')
      return asset;
    const headers = new Headers(asset.headers);
    headers.set('accept-ranges', 'bytes');
    const full = () => new Response(asset.body, { status: asset.status, headers });
    const range = request.headers.get('range');
    if (request.method !== 'GET' || !range) return full();

    const validator = request.headers.get('if-range');
    // Static Assets exposes a strong ETag, not a Last-Modified date. Any other
    // validator falls back to the complete representation, as does multipart.
    if (validator && (validator.startsWith('W/') || validator !== headers.get('etag')))
      return full();
    const parts = /^bytes=(\d*)-(\d*)$/i.exec(range);
    if (!parts || (!parts[1] && !parts[2])) return full();

    let blob: Blob;
    try {
      blob = await readLimited(asset, limit, 'video/mp4');
    } catch {
      headers.delete('content-length');
      headers.delete('etag');
      headers.delete('accept-ranges');
      headers.set('content-type', 'text/plain; charset=utf-8');
      headers.set('cache-control', 'no-store');
      return new Response('Recording unavailable', { status: 502, headers });
    }
    const size = blob.size;
    const start = parts[1] ? Number(parts[1]) : Math.max(0, size - Number(parts[2]));
    const end = parts[1] && parts[2] ? Math.min(Number(parts[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      headers.set('content-range', `bytes */${size}`);
      headers.set('content-length', '0');
      return new Response(null, { status: 416, headers });
    }
    headers.set('content-range', `bytes ${start}-${end}/${size}`);
    headers.set('content-length', String(end - start + 1));
    return new Response(blob.slice(start, end + 1), { status: 206, headers });
  },
};
