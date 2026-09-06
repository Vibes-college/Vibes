import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { capture, github, repository } from './release-utils.ts';
import { releaseTarget } from './release-policy.ts';
import { assertAssetBudget } from './budget-policy.ts';
import { assetSizes } from './asset-sizes.ts';
import { prepareArtifact } from './release-artifact.ts';
import { smokeRelease } from './release-smoke.ts';
import { run, wrangler } from './local-tools.ts';

// 阶段预览在本机完整验收后上传版本，不切生产域名或提升正式版本。
async function main(): Promise<void> {
  const [action, argument, ...extra] = process.argv.slice(2);
  if (extra.length) throw new Error('Unexpected release arguments');
  if (action === 'deploy')
    throw new Error(
      'Production deploys automatically after main checks; use release:preview for a PR',
    );
  if (action === 'restore') {
    if (!argument || !/^[a-f0-9-]{36}$/.test(argument))
      throw new Error('A recorded version id is required');
    const record = JSON.parse(readFileSync(`resources/evidence/releases/${argument}.json`, 'utf8'));
    if (
      !record.verified ||
      record.version !== argument ||
      record.origin !== releaseTarget.origin ||
      record.accountId !== releaseTarget.accountId
    )
      throw new Error('Rollback requires a verified production version record for this target');
    run(process.execPath, [wrangler, 'rollback', argument, '--yes']);
    await smokeRelease(releaseTarget.origin, record.sha);
    console.log(`Restored and verified ${record.sha}`);
    return;
  }
  if (action !== 'preview' || !argument || !/^[1-9]\d*$/.test(argument))
    throw new Error('Usage: npm run release:preview -- <PR number>');
  if (
    ['VIBES_CONTENT_DIR', 'VIBES_TAXONOMY_FILE', 'VIBES_OUT_DIR'].some((name) => process.env[name])
  )
    throw new Error('Cannot publish fixture content');
  if (capture('git', ['status', '--porcelain', '--untracked-files=normal']).trim())
    throw new Error(
      'Preview requires a clean checkout; preserve user files and use an isolated worktree if needed',
    );
  const sha = capture('git', ['rev-parse', 'HEAD']).trim();
  const pr = github(`pulls/${argument}`) as {
    state: string;
    head: { sha: string; repo: { full_name: string } };
  };
  if (pr.state !== 'open' || pr.head.sha !== sha || pr.head.repo.full_name !== repository)
    throw new Error('Preview must match the current pushed head of an open repository PR');
  process.env.SITE_URL = releaseTarget.origin;
  process.env.VIBES_DEPLOY = '1';
  process.env.CLOUDFLARE_ACCOUNT_ID = releaseTarget.accountId;
  run('npm', ['run', 'verify']);
  run('npm', ['run', 'budget']);
  if (
    capture('git', ['rev-parse', 'HEAD']).trim() !== sha ||
    capture('git', ['status', '--porcelain']).trim()
  )
    throw new Error('Source changed during preview verification');
  const latest = github(`pulls/${argument}`) as { head: { sha: string } };
  if (latest.head.sha !== sha) throw new Error('PR changed before preview upload');
  appendFileSync('dist/_headers', '\n/*\n  X-Robots-Tag: noindex, nofollow\n');
  prepareArtifact(sha);
  assertAssetBudget(assetSizes('dist'));
  const log = capture(process.execPath, [
    wrangler,
    'versions',
    'upload',
    '--preview-alias',
    `pr-${argument}`,
  ]);
  mkdirSync('resources/evidence/releases', { recursive: true });
  writeFileSync(`resources/evidence/releases/preview-${argument}-${sha}.log`, log);
  const urls = log.match(/https:\/\/[^\s]+\.workers\.dev/g) || [];
  const url = urls.find((value) => value.includes(`pr-${argument}-`)) || urls.at(-1);
  if (!url)
    throw new Error('Preview upload outcome uncertain; inspect log without blindly retrying');
  await smokeRelease(url, sha);
  console.log(
    `Preview verified: ${url} (SHA ${sha}); update PR description with this stage and its limits.`,
  );
}

// 上传或验收失败直接报告，绝不把版本上传当成生产上线。
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
