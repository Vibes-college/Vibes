// Deterministic public test material. Provider timeline text is a delta, matching
// the fixed upstream mock provider; adapters must not reinterpret it as a snapshot.
const provider = 'codex';
const timeline = <T extends object>(item: T, turnId: string) => ({
  type: 'timeline',
  provider,
  turnId,
  item,
});
const repeated = (pattern: string, length: number) =>
  pattern.repeat(Math.ceil(length / pattern.length)).slice(0, length);
export function createWorkloads() {
  const history = Array.from({ length: 1000 }, (_, index) => ({
    atMs: index,
    event: timeline(
      {
        type: index % 2 ? 'assistant_message' : 'user_message',
        messageId: `history-${index}`,
        text: repeated(`Message ${index}: public deterministic rendering fixture. `, 1024),
      },
      `history-turn-${Math.floor(index / 2)}`,
    ),
  }));
  const stream: { atMs: number; event: object }[] = [
    { atMs: 0, event: { type: 'turn_started', provider, turnId: 'stream-turn' } },
  ];
  for (let index = 0; index < 1000; index++) {
    const slot = index % 10;
    const item =
      slot === 0 || slot === 5
        ? {
            type: 'tool_call',
            callId: `tool-${Math.floor(index / 10)}`,
            name: 'Shell',
            status: slot === 0 ? 'running' : 'completed',
            error: null,
            detail: {
              type: 'shell',
              command: 'printf fixture',
              output: slot === 0 ? '' : 'fixture',
              exitCode: slot === 0 ? null : 0,
            },
          }
        : {
            type: 'assistant_message',
            messageId: `stream-${Math.floor(index / 10)}`,
            text: `Chunk ${index}: public streaming text.\n`,
          };
    stream.push({ atMs: (index + 1) * 20, event: timeline(item, 'stream-turn') });
  }
  stream.push({ atMs: 20020, event: { type: 'turn_completed', provider, turnId: 'stream-turn' } });
  const diff = Array.from({ length: 50 }, (_, file) => ({
    path: `src/file-${String(file).padStart(3, '0')}.ts`,
    before:
      Array.from(
        { length: 200 },
        (_, line) => `export const item_${line} = ${file * 200 + line};`,
      ).join('\n') + '\n',
    after:
      Array.from(
        { length: 200 },
        (_, line) => `export const item_${line} = ${file * 200 + line + 1};`,
      ).join('\n') + '\n',
  }));
  const longText = [31999, 32000, 32001, 100000]
    .flatMap((length) => [
      { kind: 'plain', length, text: repeated('Public long message. ', length) },
      {
        kind: 'single-line-code',
        length,
        text: '```ts\n' + repeated('const value = 1; ', length - 10) + '\n```',
      },
      { kind: 'chinese-emoji', length, text: repeated('中文与表情🙂测试。', length) },
      {
        kind: 'table',
        length,
        text: '| 列一 | 列二 |\n| --- | --- |\n' + repeated('| value | value |\n', length - 28),
      },
    ])
    .map((item) => ({
      ...item,
      text:
        item.text.length < item.length
          ? item.text.padEnd(item.length, ' ')
          : item.text.slice(0, item.length),
    }));
  const jsonl =
    Array.from({ length: 6000 }, (_, index) =>
      JSON.stringify({
        id: index,
        group: `group-${index % 12}`,
        amount: index % 211 === 0 ? -1 : index % 100,
        accepted: index % 7 !== 0,
      }),
    ).join('\n') + '\n';
  return {
    W0: { events: [] },
    W1: { events: history },
    W2: { events: stream, durationMs: 20020, toolStatusChanges: 200 },
    W3: { files: diff, fileCount: 50, linesPerSide: 10000 },
    W4: { cases: longText },
    W5: {
      files: {
        'data/input.jsonl': jsonl,
        'package.json': JSON.stringify({ type: 'module', scripts: { test: 'node --test' } }) + '\n',
        'src/report.js': 'export function summarize() { return null; }\n',
      },
      prompt:
        'Only modify this isolated fixture directory. Use gpt-5.6-luna with Default permissions. Implement a streaming JSONL report in src/report.js and a CLI in src/cli.js: reject rows with negative amount, count accepted valid rows and sum their amounts by group, emit sorted group results. Add node:test coverage and run it before implementation to observe the expected failure, then implement and rerun. Process data/input.jsonl (6000 rows), save output/report.json and explain validation. Use no network, installs or files outside this directory. Ask for user approval before a separate harmless command printing LUNA_APPROVAL_CHECK. A later controlled stop task is separate; do not assume stopping a turn kills every child process.',
    },
  };
}
