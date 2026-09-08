import { splitContext } from './labels.ts';
import type { ThreadMessageLike } from '@assistant-ui/react';
import type { FetchAgentTimelineResponseMessage } from '@getpaseo/protocol/messages';
export type TimelinePage = FetchAgentTimelineResponseMessage['payload'];
export type TimelineRow = TimelinePage['entries'][number];
export const maximumRows = 2000;
export function mergeRows(previous: readonly TimelineRow[], incoming: readonly TimelineRow[]) {
  const rows = new Map(previous.map((row) => [row.seqStart, row]));
  for (const row of incoming) rows.set(row.seqStart, row);
  return [...rows.values()].sort((a, b) => a.seqStart - b.seqStart);
}
export function preview(value: unknown, limit = 16_000): string {
  const text = typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? '');
  return text.length > limit ? text.slice(0, limit) + '\n…' : text;
}
export function toMessages(rows: readonly TimelineRow[], running: boolean): ThreadMessageLike[] {
  const messages: ThreadMessageLike[] = [];
  const tools = new Map<string, number>();
  let previous: TimelineRow | undefined;
  for (const row of rows) {
    const item = row.item;
    const id = `${row.turnId ?? 'history'}:${row.seqStart}`;
    const createdAt = new Date(row.timestamp);
    if (item.type === 'user_message') {
      const display = splitContext(item.text);
      messages.push({
        id,
        role: 'user',
        createdAt,
        content: [{ type: 'text', text: preview(display.text, 100_000) }],
        metadata: { custom: { work: display.work } },
      });
    } else if (item.type === 'assistant_message' || item.type === 'reasoning') {
      const text = preview(item.text, 100_000);
      const last = messages.at(-1);
      const sameMessage =
        item.type === 'assistant_message' &&
        previous?.item.type === 'assistant_message' &&
        (!item.messageId || !previous.item.messageId || item.messageId === previous.item.messageId);
      if (
        sameMessage &&
        previous &&
        previous.turnId === row.turnId &&
        previous.seqEnd + 1 === row.seqStart &&
        last?.role === 'assistant'
      ) {
        const part = last.content[0];
        if (typeof part !== 'string' && part?.type === 'text')
          messages[messages.length - 1] = {
            ...last,
            content: [{ type: 'text', text: preview(part.text + text, 100_000) }],
          };
      } else
        messages.push({
          id,
          role: 'assistant',
          createdAt,
          content: [{ type: item.type === 'reasoning' ? 'reasoning' : 'text', text }],
          status: { type: 'complete', reason: 'stop' },
        });
    } else if (item.type === 'tool_call') {
      const toolKey = `${row.turnId ?? ''}:${item.callId}`;
      const prior = tools.get(toolKey);
      const message: ThreadMessageLike = {
        id: prior === undefined ? id : messages[prior].id,
        role: 'assistant',
        createdAt,
        content: [
          {
            type: 'tool-call',
            toolCallId: item.callId,
            toolName: item.name,
            args: {},
            argsText: preview(item.detail),
            ...(item.status === 'running'
              ? {}
              : { result: preview(item.error ?? item.detail), isError: item.status === 'failed' }),
          },
        ],
        status: { type: 'complete', reason: 'stop' },
      };
      if (prior === undefined) {
        tools.set(toolKey, messages.length);
        messages.push(message);
      } else messages[prior] = message;
    } else if (item.type === 'error')
      messages.push({
        id,
        role: 'assistant',
        createdAt,
        content: [{ type: 'text', text: preview(item.message) }],
        status: { type: 'incomplete', reason: 'error' },
      });
    else if (item.type === 'todo')
      messages.push({
        id,
        role: 'assistant',
        createdAt,
        content: [
          {
            type: 'text',
            text: item.items.map((task) => `${task.completed ? '✓' : '○'} ${task.text}`).join('\n'),
          },
        ],
        status: { type: 'complete', reason: 'stop' },
      });
    else if (item.type === 'compaction')
      messages.push({
        id,
        role: 'assistant',
        createdAt,
        content: [{ type: 'text', text: item.status === 'loading' ? '…' : '↪' }],
        status: { type: 'complete', reason: 'stop' },
      });
    previous = row;
  }
  const last = messages.at(-1);
  if (running && last?.role === 'assistant')
    messages[messages.length - 1] = { ...last, status: { type: 'running' } };
  return messages;
}
