import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { databaseArgs, localState, requireAction, root, run, wrangler } from './local-tools.ts';

const action = requireAction(process.argv.slice(2), ['reset', 'migrate']);
if (action === 'reset') {
  console.log('清空本项目的本地 D1 测试库；不连接线上数据库。');
  rmSync(join(root, localState, 'v3/d1'), { recursive: true, force: true });
}
run(process.execPath, [wrangler, ...databaseArgs('migrate')]);
if (action === 'reset') run(process.execPath, [wrangler, ...databaseArgs('seed')]);
console.log(
  action === 'reset' ? '本地数据库已重建并填入测试数据。' : '本地数据库结构已更新，已有数据保留。',
);
