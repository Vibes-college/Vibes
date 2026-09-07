import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { walk, type Node } from './tree.ts';

export default function rehypeImageSize() {
  return async (input: unknown) => {
    const tree = input as Node;
    const images: Node[] = [];
    walk(tree, (node) => {
      if (node.tagName === 'img') images.push(node);
    });
    const publicDir = resolve('public');
    for (const node of images) {
      const props = node.properties!;
      const src = String(props.src ?? '');
      if (!src.startsWith('/') || src.startsWith('//')) continue;
      const file = resolve(publicDir, `.${decodeURIComponent(src.split(/[?#]/)[0])}`);
      if (!file.startsWith(publicDir + sep))
        throw new Error(`Image escapes public directory: ${src}`);
      const metadata = await imageMetadata(await readFile(file), file);
      const width =
        Number(props.width) ||
        (Number(props.height)
          ? (Number(props.height) * metadata.width) / metadata.height
          : metadata.width);
      const height = Number(props.height) || (width * metadata.height) / metadata.width;
      props.width = Math.round(width);
      props.height = Math.round(height);
      props.loading = 'lazy';
      props.decoding = 'async';
    }
  };
}
