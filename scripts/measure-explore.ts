import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readCatalog } from '../src/lib/content/catalog.ts';
import { sourceRevision } from '../src/lib/content/revision.ts';
import { measurePreview } from './scale-preview.ts';
import { scaleMarker } from './scale-marker.ts';

const evidence = 'resources/evidence/001-multilingual-explore';
mkdirSync('.scratch', { recursive: true });
mkdirSync(evidence, { recursive: true });
const fixture = mkdtempSync(resolve('.scratch/explore-scale-'));
const content = join(fixture, 'works');
const output = join(fixture, 'dist');
const catalog = readCatalog();
const englishSample = catalog.works.find((work) => work.versions.en)?.versions.en;
if (!englishSample) throw new Error('Scale test requires the reviewed English sample');
const taxonomy = join(fixture, 'taxonomy.json');
writeFileSync(taxonomy, JSON.stringify(catalog.taxonomy));
try {
  for (let index = 0; index < 5000; index++) {
    const work = structuredClone(catalog.works[index % catalog.works.length]);
    work.meta.id = `scale-${index}`;
    work.meta.order = index;
    work.meta.related = [];
    const original = work.versions.zh!;
    original.data.title = `合成样例 ${index}`;
    original.body += `\n\n## 规模验收\n\n正文定位 ${scaleMarker(index)}。这段文字仅用于规模测试。\n`;
    work.versions.en = structuredClone(englishSample);
    const english = work.versions.en!;
    english.data.title = `Synthetic example ${index}`;
    english.body += `\n\n## Scale verification\n\nBody marker ${scaleMarker(index)}. Synthetic testing only.\n`;
    english.data.sourceRevision = sourceRevision(work);
    const directory = join(content, work.meta.id);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'work.json'), JSON.stringify(work.meta));
    for (const locale of ['zh', 'en'] as const) {
      const version = work.versions[locale]!;
      writeFileSync(
        join(directory, `${locale}.md`),
        `---\n${Object.entries(version.data)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n')}\n---\n${version.body}`,
      );
    }
  }
  const started = performance.now();
  const build = spawnSync('npm', ['run', 'build'], {
    env: {
      ...process.env,
      VIBES_CONTENT_DIR: content,
      VIBES_TAXONOMY_FILE: taxonomy,
      VIBES_OUT_DIR: output,
    },
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  });
  writeFileSync(join(evidence, 'scale-build.log'), build.stdout + build.stderr);
  if (build.status !== 0) throw new Error('Scale build failed; inspect scale-build.log');
  const buildMs = Math.round(performance.now() - started);
  const assets = listFiles(output);
  const searchFiles = listFiles(join(output, 'pagefind'));
  const sizes = {
    buildMs,
    fileCount: assets.length,
    largestFile: Math.max(...assets.map((file) => statSync(file).size)),
    searchBytes: searchFiles.reduce((sum, file) => sum + statSync(file).size, 0),
    searchGzipBytes: searchFiles.reduce(
      (sum, file) => sum + gzipSync(readFileSync(file)).length,
      0,
    ),
    homepageGzip: gzipSync(readFileSync(join(output, 'zh/index.html'))).length,
  };
  writeFileSync(join(evidence, 'scale-sizes.json'), JSON.stringify(sizes, null, 2));
  const performanceResults = await measurePreview(fixture, output);
  writeFileSync(
    join(evidence, 'explore-scale.md'),
    `# Explore规模验收\n\n${new Date().toISOString()}；5000件×2语言，隔离合成语料，不部署。复用真实页面、24种中文正文和一篇英文正文，以独有正文标记检索；语料词汇多样性低于真实一万篇文章。\n\n首中末双语正文搜索、打开详情、无JS第二页与末页通过。\n\n390×844；下行1.6Mbps，上行750Kbps，RTT150ms，CPU4倍；每语言5次冷上下文和5次同查询热缓存。\n\n\
\
\
${JSON.stringify({ sizes, performanceResults }, null, 2)}\n\n全部索引总量不等于单次查询传输量；首屏无搜索请求。测量采用Node静态gzip服务和真实构建产物，不是Cloudflare边缘速度；Cloudflare账户上限另见发布实录。\n`,
  );
  console.log(JSON.stringify({ sizes, performanceResults }, null, 2));
  if (performanceResults.some((row) => !row.pass))
    throw new Error('Search performance target missed; evidence saved, targets unchanged');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}
