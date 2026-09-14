import { spawn } from 'node:child_process';
import { currentDemoProof, saveDemoProof } from './great-ui-proof.ts';
const args = process.argv.slice(2);
const before = await currentDemoProof('standalone');
const child = spawn(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'playwright.great-ui.config.ts',
    ...args,
  ],
  { stdio: 'inherit' },
);
const code = await new Promise<number>((resolve, reject) => {
  child.once('error', reject);
  child.once('close', (status) => resolve(status ?? 1));
});
if (code !== 0) process.exit(code);
// A filtered rerun is useful for debugging but cannot certify the whole fixed path.
if (args.length) process.exit(0);
await saveDemoProof(before, 'standalone');
