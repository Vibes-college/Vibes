import { requireAction, run } from './local-tools.ts';

requireAction(['e2e', ...process.argv.slice(2)], ['e2e']);
run('npm', ['run', 'build']);
run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test']);
