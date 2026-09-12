import { requireAction, run } from './local-tools.ts';

requireAction(['e2e', ...process.argv.slice(2)], ['e2e']);
// Article references identify the published site, never a local test address.
// Pass the same origin through build and Playwright's metadata expectations.
process.env.SITE_URL ??= 'https://vibes.college';
run('npm', ['run', 'build']);
run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test']);
