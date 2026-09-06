import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export function assetFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? assetFiles(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
// 搜索资源独立计量，避免混同首屏传输量；文件总数用于实际托管限制检查。
export function assetSizes(directory: string) {
  const files = assetFiles(directory);
  const search = files.filter((file) => file.startsWith(join(directory, 'pagefind') + '/'));
  return {
    fileCount: files.length,
    largestFile: Math.max(...files.map((file) => statSync(file).size)),
    searchFiles: search.length,
    searchBytes: search.reduce((sum, file) => sum + statSync(file).size, 0),
    searchGzipBytes: search.reduce((sum, file) => sum + gzipSync(readFileSync(file)).length, 0),
  };
}
