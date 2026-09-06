import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { run, wrangler } from './local-tools.ts';
import { releaseTarget, requireReleaseChecks } from './release-policy.ts';
import { siteConfig } from '../src/config/site.ts';
import { assetSizes } from './asset-sizes.ts';
import { assertAssetBudget } from './budget-policy.ts';

const [action, version, ...extra] = process.argv.slice(2);
if (
  !['deploy', 'restore'].includes(action) ||
  extra.length ||
  (action === 'deploy' && version) ||
  (action === 'restore' && !version)
)
  throw new Error('Usage: npm run deploy | npm run release:restore -- <recorded-version-id>');
if (['VIBES_CONTENT_DIR', 'VIBES_TAXONOMY_FILE', 'VIBES_OUT_DIR'].some((name) => process.env[name]))
  throw new Error('Refusing to deploy isolated fixture content');
if (process.env.SITE_URL && process.env.SITE_URL !== releaseTarget.origin)
  throw new Error('SITE_URL differs from the allowed test target');
siteConfig(releaseTarget.origin, true);
process.env.SITE_URL = releaseTarget.origin;
process.env.VIBES_DEPLOY = '1';
process.env.CLOUDFLARE_ACCOUNT_ID = releaseTarget.accountId;
const evidence = 'resources/evidence/001-multilingual-explore/releases';
mkdirSync(evidence, { recursive: true });
mkdirSync('.scratch', { recursive: true });
const config = resolve('.scratch/release-config.json');
writeFileSync(
  config,
  JSON.stringify({
    name: releaseTarget.workerName,
    account_id: releaseTarget.accountId,
    compatibility_date: '2026-09-05',
    workers_dev: true,
    routes: [],
    assets: { directory: resolve('dist'), not_found_handling: '404-page' },
  }),
);

if (action === 'restore') {
  if (!/^[a-f0-9-]{36}$/.test(version!)) throw new Error('Invalid version id');
  const record = join(evidence, `${version}.json`);
  if (!existsSync(record))
    throw new Error('Only a locally recorded, verified version can be restored');
  const saved = JSON.parse(readFileSync(record, 'utf8'));
  if (
    saved.origin !== releaseTarget.origin ||
    saved.accountId !== releaseTarget.accountId ||
    saved.version !== version
  )
    throw new Error('Release record target mismatch');
  run(process.execPath, [wrangler, 'versions', 'view', version!, '--config', config, '--json']);
  run(process.execPath, [
    wrangler,
    'rollback',
    version!,
    '--config',
    config,
    '--yes',
    '--message',
    'Authorized independent test-site recovery exercise',
  ]);
  console.log(
    `Restored recorded version ${version} at ${releaseTarget.origin}; verify visible pages before reporting success.`,
  );
} else {
  clean();
  const sha = capture('git', ['rev-parse', 'HEAD']).trim();
  const result = JSON.parse(
    capture('gh', ['api', `repos/Vibes-college/Vibes/commits/${sha}/check-runs?per_page=100`]),
  );
  requireReleaseChecks(sha, result.check_runs);
  run('npm', ['run', 'verify']);
  run('npm', ['run', 'budget']);
  clean();
  if (capture('git', ['rev-parse', 'HEAD']).trim() !== sha)
    throw new Error('Source changed during release verification');
  const assets = assetSizes('dist');
  assertAssetBudget(assets);
  const log = capture(process.execPath, [wrangler, 'deploy', '--config', config]);
  console.log(log);
  const deployedVersion = log.match(/Current Version ID:\s*([a-f0-9-]{36})/i)?.[1];
  writeFileSync(join(evidence, `${sha}.log`), log);
  if (!deployedVersion)
    throw new Error(
      'Deployment outcome needs inspection: version id missing; do not redeploy blindly',
    );
  writeFileSync(
    join(evidence, `${deployedVersion}.json`),
    JSON.stringify(
      {
        sha,
        version: deployedVersion,
        ...releaseTarget,
        assets,
        checkedAt: new Date().toISOString(),
        checks: ['local verify', 'local budget', 'same-SHA GitHub verify/budget'],
      },
      null,
      2,
    ),
  );
  console.log(
    `Deployed ${sha} to ${releaseTarget.origin}; verify visible pages before reporting success.`,
  );
}
function capture(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (result.error || result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  return result.stdout;
}
function clean() {
  if (capture('git', ['status', '--porcelain']).trim())
    throw new Error('Release requires a clean committed checkout');
}
