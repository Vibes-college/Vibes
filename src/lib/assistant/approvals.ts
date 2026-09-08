import type { ThreadMessageLike, RespondToToolApprovalOptions } from '@assistant-ui/react';
import type { AgentPermissionRequest } from '@getpaseo/protocol/agent-types';
import type { AssistantStore } from './store.ts';
import type { Labels } from './labels.ts';
import { preview } from './timeline.ts';
export function permissionMessages(
  requests: readonly AgentPermissionRequest[],
  t: Labels,
): ThreadMessageLike[] {
  return requests.map((request) => ({
    id: `permission:${request.id}`,
    role: 'assistant',
    status: { type: 'requires-action', reason: 'tool-calls' },
    content: [
      {
        type: 'tool-call',
        toolCallId: `permission:${request.id}`,
        toolName: request.title || request.name,
        args: {},
        argsText: preview(request.detail ?? request.input ?? {}),
        approval: {
          id: request.id,
          prompt: request.description || t.approval,
          options: request.actions?.length
            ? request.actions.map((action) => ({
                id: action.id,
                label: action.label,
                kind: action.behavior === 'allow' ? 'allow-once' : 'reject-once',
              }))
            : [
                { id: 'allow', label: t.allow, kind: 'allow-once' },
                { id: 'deny', label: t.deny, kind: 'reject-once' },
              ],
        },
      },
    ],
  }));
}
export async function respondToApproval(
  store: AssistantStore,
  options: RespondToToolApprovalOptions,
) {
  const { agent, connection, loading, busy, error, unknown } = store.getSnapshot();
  const request = agent?.pendingPermissions.find((value) => value.id === options.approvalId);
  if (
    !agent ||
    !request ||
    connection !== 'ready' ||
    loading ||
    busy ||
    unknown ||
    error?.endsWith('Unknown')
  )
    throw new Error('Approval unavailable. Refresh status.');
  const action = request.actions?.find((value) => value.id === options.optionId);
  if (request.actions?.length && !action) throw new Error('Unknown approval action.');
  await store.permission(agent.id, request.id, {
    behavior: action?.behavior ?? (options.approved ? 'allow' : 'deny'),
    ...(action ? { selectedActionId: action.id } : {}),
  });
  if (
    store.getSnapshot().unknown ||
    store.getSnapshot().error?.startsWith('permission') ||
    store.getSnapshot().error?.endsWith('Unknown')
  )
    throw new Error('Approval was not confirmed. Refresh status.');
}
