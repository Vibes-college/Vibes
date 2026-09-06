import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { artifactDigest, requirePages } from './release-utils.ts';

// 为验收后的产物绑定源码SHA和内容摘要，供发布和线上验收核对。
export function prepareArtifact(sha: string, directory = 'dist'): void {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid artifact SHA');
  requirePages(directory);
  writeFileSync(
    `${directory}/__release.json`,
    JSON.stringify({ sha, digest: artifactDigest(directory) }),
  );
}

// 下载后重新核对摘要；不得把别的提交或被修改的构建当作本次验收产物。
export function verifyArtifact(sha: string, directory = 'dist'): void {
  const record = JSON.parse(readFileSync(`${directory}/__release.json`, 'utf8'));
  requirePages(directory);
  if (record.sha !== sha || record.digest !== artifactDigest(directory))
    throw new Error('Artifact SHA or content digest mismatch');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  prepareArtifact(process.env.GITHUB_SHA || '');
