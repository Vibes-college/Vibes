import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { requireProduction } from './ci-policy.ts';
import { capture, github } from './release-utils.ts';
import { verifyArtifact } from './release-artifact.ts';
import { releaseTarget } from './release-policy.ts';
import { wrangler } from './local-tools.ts';
import { assertAssetBudget } from './budget-policy.ts';
import { assetSizes } from './asset-sizes.ts';
import { smokeRelease } from './release-smoke.ts';

// 发布只消费同一main运行验收过的产物；不重复安装浏览器、构建或执行整套测试。
async function main(): Promise<void> {
  const sha = process.env.GITHUB_SHA || '';
  const current = github('git/ref/heads/main') as { object: { sha: string } };
  requireProduction(
    { name: process.env.GITHUB_EVENT_NAME || '', ref: process.env.GITHUB_REF || '' },
    sha,
    current.object.sha,
    [process.env.VERIFY_RESULT || '', process.env.BUDGET_RESULT || ''],
  );
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('Missing Cloudflare deployment secret');
  if (capture('git', ['rev-parse', 'HEAD']).trim() !== sha)
    throw new Error('Checkout SHA mismatch');
  verifyArtifact(sha);
  assertAssetBudget(assetSizes('dist'));
  process.env.CLOUDFLARE_ACCOUNT_ID = releaseTarget.accountId;
  const directory = 'resources/evidence/releases';
  mkdirSync(directory, { recursive: true });
  // 保存发布前版本便于回滚，失败则停止，不在不确定目标上继续发布。
  const before = capture(process.execPath, [wrangler, 'deployments', 'list', '--json']);
  writeFileSync(`${directory}/${sha}-before.json`, before);
  const latest = github('git/ref/heads/main') as { object: { sha: string } };
  if (latest.object.sha !== sha) throw new Error('Main advanced before deployment');
  const log = capture(process.execPath, [wrangler, 'deploy']);
  writeFileSync(`${directory}/${sha}.log`, log);
  const version = log.match(/Current Version ID:\s*([a-f0-9-]{36})/i)?.[1];
  const record = {
    sha,
    version,
    ...releaseTarget,
    runId: process.env.GITHUB_RUN_ID,
    verified: false,
  };
  writeFileSync(`${directory}/${sha}.json`, JSON.stringify(record, null, 2));
  if (!version) throw new Error('Deployment outcome uncertain; inspect record before retrying');
  await smokeRelease(releaseTarget.origin, sha);
  const verified = JSON.stringify(
    {
      ...record,
      verified: true,
      verifiedAt: new Date().toISOString(),
      artifact: JSON.parse(readFileSync('dist/__release.json', 'utf8')),
    },
    null,
    2,
  );
  writeFileSync(`${directory}/${sha}.json`, verified);
  writeFileSync(`${directory}/${version}.json`, verified);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `已部署并验证 [vibes.college](${releaseTarget.origin}/zh/)\n\nSHA: ${sha}\n\nCloudflare版本: ${version}\n\n本机分支/worktree由AI确认无占用和未保存工作后清理。\n`,
    );
  console.log(`Production verified: ${releaseTarget.origin}, SHA ${sha}`);
}

// 任何发布或线上验收失败都使工作流失败，不触发成功收尾。
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
