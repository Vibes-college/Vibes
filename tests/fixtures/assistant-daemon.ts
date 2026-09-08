import type { Page, WebSocketRoute } from '@playwright/test';
import {
  createDaemonChannel,
  exportPublicKey,
  generateKeyPair,
  type Transport,
} from '@getpaseo/relay/e2ee';
import {
  AgentSnapshotPayloadSchema,
  WorkspaceDescriptorPayloadSchema,
  WSInboundMessageSchema,
  WSOutboundMessageSchema,
  type AgentSnapshotPayload,
  type SessionInboundMessage,
  type SessionOutboundMessage,
  type AgentStreamEventPayload,
} from '@getpaseo/protocol/messages';
import type { TimelineRow } from '../../src/lib/assistant/timeline.ts';
export function snapshot(id = 'alpha'): AgentSnapshotPayload {
  return AgentSnapshotPayloadSchema.parse({
    id,
    provider: 'codex',
    cwd: '/tmp/vibes-fixture',
    model: 'test-model',
    createdAt: '2026-09-07T00:00:00Z',
    updatedAt: '2026-09-07T00:00:00Z',
    lastUserMessageAt: null,
    status: 'idle',
    capabilities: {
      supportsStreaming: true,
      supportsSessionPersistence: true,
      supportsDynamicModes: false,
      supportsMcpServers: false,
      supportsReasoningStream: true,
      supportsToolInvocations: true,
    },
    currentModeId: null,
    availableModes: [],
    pendingPermissions: [],
    persistence: null,
    title: id === 'alpha' ? '作品讨论' : '另一会话',
    labels: { source: 'vibes' },
  });
}
const project = {
  projectKey: 'fixture',
  projectName: 'fixture',
  checkout: {
    cwd: '/tmp/vibes-fixture',
    isGit: false as const,
    currentBranch: null,
    remoteUrl: null,
    worktreeRoot: null,
    isPaseoOwnedWorktree: false as const,
    mainRepoRoot: null,
  },
};
const workspace = WorkspaceDescriptorPayloadSchema.parse({
  id: 'workspace',
  projectId: 'fixture',
  projectDisplayName: 'fixture',
  projectRootPath: '/tmp/vibes-fixture',
  projectKind: 'non_git',
  workspaceKind: 'directory',
  name: 'fixture',
  status: 'done',
  activityAt: null,
  project,
});
export class AssistantDaemon {
  readonly key = generateKeyPair();
  readonly offer = JSON.stringify({
    v: 2,
    serverId: 'vibes-test-daemon',
    daemonPublicKeyB64: exportPublicKey(this.key.publicKey),
    relay: { endpoint: 'relay.paseo.sh:443', useTls: true },
  });
  readonly requests: SessionInboundMessage[] = [];
  readonly agents = new Map([
    ['alpha', snapshot()],
    ['beta', snapshot('beta')],
  ]);
  readonly timelines = new Map<string, TimelineRow[]>();
  readonly failures: string[] = [];
  epoch = 'test-epoch';
  available = true;
  acceptSends = true;
  disconnectOnSend = false;
  dropAfterAccept = false;
  dropAfterPermission = false;
  historyFailures = 0;
  subscriptionFailures = 0;
  serverIdentity = 'vibes-test-daemon';
  createdConnections = 0;
  maxConnections = 0;
  private silent = new Set<WebSocketRoute>();
  get activeConnections() {
    return this.connections.size;
  }
  silenceCurrent() {
    for (const { socket } of this.connections) this.silent.add(socket);
  }
  private connections = new Set<{
    socket: WebSocketRoute;
    send: (message: SessionOutboundMessage) => Promise<void>;
  }>();
  async install(page: Page) {
    await page.routeWebSocket('wss://relay.paseo.sh/**', (socket) => {
      const transport: Transport = {
        send: (data) => socket.send(typeof data === 'string' ? data : Buffer.from(data)),
        close: () => {
          void socket.close();
        },
        onmessage: null,
        onclose: null,
        onerror: null,
      };
      const channel = createDaemonChannel(transport, this.key, {
        onmessage: (raw) => {
          try {
            const input = WSInboundMessageSchema.parse(
              JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)),
            );
            if (input.type === 'hello')
              void send({
                type: 'status',
                payload: {
                  status: 'server_info',
                  serverId: this.serverIdentity,
                  version: '0.7.2',
                  features: { selectiveAgentTimeline: true },
                },
              });
            else if (input.type === 'session')
              void this.handle(input.message, send, socket).catch((error) => {
                this.failures.push(String(error));
              });
            else if (input.type === 'ping')
              void channel.then((c) => c.send(JSON.stringify({ type: 'pong' })));
          } catch (error) {
            this.failures.push(String(error));
          }
        },
      });
      const send = async (message: SessionOutboundMessage) => {
        const envelope = WSOutboundMessageSchema.parse({ type: 'session', message });
        await (await channel).send(JSON.stringify(envelope));
      };
      const connection = { socket, send };
      this.connections.add(connection);
      this.createdConnections++;
      this.maxConnections = Math.max(this.maxConnections, this.connections.size);
      socket.onMessage(
        (data) =>
          !this.silent.has(socket) &&
          transport.onmessage?.({
            data: typeof data === 'string' ? data : Uint8Array.from(data).buffer,
            isBinary: typeof data !== 'string',
          }),
      );
      socket.onClose(() => {
        this.connections.delete(connection);
        this.silent.delete(socket);
        transport.onclose?.(1000, 'test closed');
      });
    });
  }
  private async handle(
    message: SessionInboundMessage,
    send: (message: SessionOutboundMessage) => Promise<void>,
    socket: WebSocketRoute,
  ) {
    this.requests.push(message);
    const requestId =
      'requestId' in message && typeof message.requestId === 'string' ? message.requestId : '';
    switch (message.type) {
      case 'ping':
        return send({
          type: 'pong',
          payload: {
            requestId,
            clientSentAt: message.clientSentAt,
            serverReceivedAt: Date.now(),
            serverSentAt: Date.now(),
          },
        });
      case 'fetch_agents_request':
        return send({
          type: 'fetch_agents_response',
          payload: {
            requestId,
            entries: [...this.agents.values()].map((agent) => ({ agent, project })),
            pageInfo: { nextCursor: null, prevCursor: null, hasMore: false },
          },
        });
      case 'list_available_providers_request':
        return send({
          type: 'list_available_providers_response',
          payload: {
            requestId,
            fetchedAt: '2026-09-07T00:00:00Z',
            providers: [{ provider: 'codex', available: this.available }],
          },
        });
      case 'list_provider_models_request':
        return send({
          type: 'list_provider_models_response',
          payload: {
            requestId,
            provider: 'codex',
            fetchedAt: '2026-09-07T00:00:00Z',
            models: [{ id: 'test-model', provider: 'codex', label: 'Test model', isDefault: true }],
          },
        });
      case 'agent.timeline.set_subscription.request':
        if (this.subscriptionFailures > 0) {
          this.subscriptionFailures--;
          await socket.close({ code: 1012, reason: 'test subscription failure' });
          return;
        }
        return send({
          type: 'agent.timeline.set_subscription.response',
          payload: { requestId, agentIds: message.agentIds },
        });
      case 'fetch_agent_timeline_request': {
        const all = this.timelines.get(message.agentId) ?? [];
        const entries =
          message.direction === 'before'
            ? all.filter((row) => row.seqStart < (message.cursor?.seq ?? 0)).slice(-200)
            : all.slice(-200);
        return send({
          type: 'fetch_agent_timeline_response',
          payload: {
            requestId,
            agentId: message.agentId,
            agent: this.agents.get(message.agentId) ?? null,
            direction: message.direction ?? 'tail',
            projection: 'canonical',
            epoch: this.epoch,
            reset: false,
            staleCursor: false,
            gap: false,
            window: { minSeq: 0, maxSeq: Math.max(0, all.length - 1), nextSeq: all.length },
            startCursor: entries[0] ? { epoch: this.epoch, seq: entries[0].seqStart } : null,
            endCursor: entries.at(-1) ? { epoch: this.epoch, seq: entries.at(-1)!.seqEnd } : null,
            hasOlder: !!entries[0] && entries[0].seqStart > 0,
            hasNewer: false,
            entries,
            error:
              this.historyFailures > 0
                ? (this.historyFailures--, 'test history unavailable')
                : null,
          },
        });
      }
      case 'fetch_agent_request':
        return send({
          type: 'fetch_agent_response',
          payload: {
            requestId,
            agent: this.agents.get(message.agentId) ?? null,
            project,
            error: null,
          },
        });
      case 'open_project_request':
        return send({
          type: 'open_project_response',
          payload: { requestId, workspace, error: null },
        });
      case 'create_agent_request': {
        const agent = { ...snapshot('created'), title: 'Vibes', cwd: message.config.cwd };
        this.agents.set(agent.id, agent);
        await send({
          type: 'status',
          payload: { status: 'agent_created', requestId, agentId: agent.id, agent },
        });
        return this.broadcast({
          type: 'agent_update',
          payload: { kind: 'upsert', agent, project },
        });
      }
      case 'send_agent_message_request': {
        if (this.dropAfterAccept) {
          await this.append(message.agentId, {
            type: 'user_message',
            text: message.text,
            clientMessageId: message.messageId,
          });
          await socket.close({ code: 1012, reason: 'test lost receipt' });
          return;
        }
        if (this.disconnectOnSend) {
          await socket.close({ code: 1012, reason: 'test interruption' });
          return;
        }
        await send({
          type: 'send_agent_message_response',
          payload: {
            requestId,
            agentId: message.agentId,
            accepted: this.acceptSends,
            error: this.acceptSends ? null : 'test refusal',
          },
        });
        if (!this.acceptSends) return;
        const agent = this.agents.get(message.agentId)!;
        this.agents.set(agent.id, { ...agent, status: 'running' });
        await this.broadcast({
          type: 'agent_update',
          payload: { kind: 'upsert', agent: this.agents.get(agent.id)!, project },
        });
        await this.append(agent.id, {
          type: 'user_message',
          text: message.text,
          clientMessageId: message.messageId,
        });
        await this.stream(agent.id, { type: 'turn_started', provider: 'codex', turnId: 'turn-1' });
        await this.append(agent.id, {
          type: 'assistant_message',
          text: '正在分析',
          messageId: 'reply',
        });
        await this.append(agent.id, {
          type: 'assistant_message',
          text: '这件作品。',
          messageId: 'reply',
        });
        await this.append(agent.id, {
          type: 'tool_call',
          callId: 'read-1',
          name: 'Read',
          status: 'running',
          detail: { type: 'read', filePath: 'README.md' },
          error: null,
        });
        return;
      }
      case 'agent_permission_response': {
        const agent = this.agents.get(message.agentId)!;
        this.agents.set(agent.id, {
          ...agent,
          pendingPermissions: agent.pendingPermissions.filter((p) => p.id !== message.requestId),
        });
        if (this.dropAfterPermission) {
          await socket.close({ code: 1012, reason: 'test lost permission receipt' });
          return;
        }
        await this.broadcast({
          type: 'agent_permission_resolved',
          payload: {
            agentId: agent.id,
            requestId: message.requestId,
            resolution: message.response,
          },
        });
        return this.broadcast({
          type: 'agent_update',
          payload: { kind: 'upsert', agent: this.agents.get(agent.id)!, project },
        });
      }
      case 'cancel_agent_request': {
        const agent = {
          ...this.agents.get(message.agentId)!,
          status: 'idle' as const,
          pendingPermissions: [],
        };
        this.agents.set(agent.id, agent);
        await send({
          type: 'cancel_agent_response',
          payload: { requestId, agentId: agent.id, agent, error: null },
        });
        return this.stream(agent.id, {
          type: 'turn_canceled',
          provider: 'codex',
          turnId: 'turn-1',
          reason: 'user canceled',
        });
      }
      default:
        return;
    }
  }
  async broadcast(message: SessionOutboundMessage) {
    await Promise.all(
      [...this.connections]
        .filter((connection) => !this.silent.has(connection.socket))
        .map((connection) => connection.send(message)),
    );
  }
  async stream(agentId: string, event: AgentStreamEventPayload, seq?: number) {
    await this.broadcast({
      type: 'agent_stream',
      payload: {
        agentId,
        event,
        timestamp: '2026-09-07T00:00:00Z',
        ...(seq !== undefined ? { seq, epoch: this.epoch } : {}),
      },
    });
  }
  async append(agentId: string, item: TimelineRow['item']) {
    const rows = this.timelines.get(agentId) ?? [];
    const seq = rows.length;
    const row: TimelineRow = {
      provider: 'codex',
      item,
      turnId: 'turn-1',
      timestamp: '2026-09-07T00:00:00Z',
      seqStart: seq,
      seqEnd: seq,
      sourceSeqRanges: [{ startSeq: seq, endSeq: seq }],
      collapsed: [],
    };
    this.timelines.set(agentId, [...rows, row]);
    await this.stream(
      agentId,
      { type: 'timeline', provider: 'codex', item, turnId: 'turn-1' },
      seq,
    );
  }
  async permission(agentId = 'alpha', kind: 'tool' | 'question' = 'tool') {
    const request = {
      id: 'permission-1',
      provider: 'codex',
      kind,
      name: kind === 'question' ? 'AskUserQuestion' : 'Read',
      title: kind === 'question' ? '选择分析范围' : '允许读取文件？',
      input:
        kind === 'question'
          ? {
              questions: [
                {
                  id: 'scope',
                  header: '范围',
                  question: '要分析哪些方面？',
                  multiSelect: true,
                  options: [{ label: '界面' }, { label: '实现' }],
                },
                {
                  id: 'output',
                  header: '输出',
                  question: '希望怎样输出？',
                  multiSelect: false,
                  options: [{ label: '简短说明' }, { label: '详细说明' }],
                },
              ],
            }
          : { path: 'README.md' },
    };
    const agent = {
      ...this.agents.get(agentId)!,
      status: 'running' as const,
      pendingPermissions: [request],
    };
    this.agents.set(agentId, agent);
    await this.broadcast({ type: 'agent_update', payload: { kind: 'upsert', agent, project } });
    await this.stream(agentId, { type: 'permission_requested', provider: 'codex', request });
  }
  async complete(agentId = 'alpha') {
    await this.append(agentId, {
      type: 'tool_call',
      callId: 'read-1',
      name: 'Read',
      status: 'completed',
      detail: { type: 'read', filePath: 'README.md', content: 'fixture content' },
      error: null,
    });
    this.agents.set(agentId, { ...this.agents.get(agentId)!, status: 'idle' });
    await this.stream(agentId, { type: 'turn_completed', provider: 'codex', turnId: 'turn-1' });
  }
  async drop() {
    await Promise.all(
      [...this.connections].map((connection) =>
        connection.socket.close({ code: 1012, reason: 'test reconnect' }),
      ),
    );
  }
}
