import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyImageSrcsets, type ImageManifest } from '../../scripts/optimize-images.ts';

const manifest: ImageManifest = {
  thresholdBytes: 200 * 1024,
  generatedAt: 'build',
  largestOutputBytes: 123,
  images: {
    '/images/prose/example.jpg': {
      source: '/images/prose/example.jpg',
      width: 1600,
      height: 900,
      fallbackBytes: 123,
      variants: [
        { width: 480, path: '/images/prose/example-480w.webp', bytes: 20 },
        { width: 960, path: '/images/prose/example-960w.webp', bytes: 40 },
      ],
      srcset: '/images/prose/example-480w.webp 480w, /images/prose/example-960w.webp 960w',
    },
  },
};

test('adds a responsive srcset to optimized local images', () => {
  const html = '<img src="/images/prose/example.jpg" width="400" height="225">';
  const result = applyImageSrcsets(html, manifest);
  assert.match(result, /srcset="\/images\/prose\/example-480w\.webp 480w/);
  assert.match(result, /sizes="400px"/);
});

test('uses the content width instead of the intrinsic source width for sizes', () => {
  const html = '<img src="/images/prose/example.jpg" width="3820" height="1796">';
  const result = applyImageSrcsets(html, manifest);
  assert.match(result, /sizes="\(max-width: 830px\) 100vw, 830px"/);
});

test('leaves unknown and already responsive images unchanged', () => {
  const unknown = '<img src="/images/prose/missing.jpg">';
  const existing = '<img src="/images/prose/example.jpg" srcset="/custom.webp 1x">';
  assert.equal(applyImageSrcsets(unknown, manifest), unknown);
  assert.equal(applyImageSrcsets(existing, manifest), existing);
});
