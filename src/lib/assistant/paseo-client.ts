import { createPaseoApi, type PaseoAgentProvider } from '@getpaseo/client';
import { DaemonClient, type DaemonEvent } from '@getpaseo/client/internal/daemon-client';
import { buildRelayWebSocketUrl } from '@getpaseo/protocol/daemon-endpoints';
import type { AgentPermissionResponse } from '@getpaseo/protocol/agent-types';
import type { SavedDevice } from './pairing.ts';
import type { TimelinePage } from './timeline.ts';
import { RecoveryFault } from './recovery.ts';
import type { HeartbeatPayload } from './activity.ts';
export type { DaemonEvent };

// Keep the published SDK's internal cancel/approval seam in this module only.
export function createConnection(device: SavedDevice) {
  const silent = () => {};
  const driver = new DaemonClient({
    url: buildRelayWebSocketUrl({
      endpoint: device.offer.relay.endpoint,
      useTls: true,
      serverId: device.offer.serverId,
      role: 'client',
    }),
    clientId: device.clientId,
    clientType: 'browser',
    e2ee: { enabled: true, daemonPublicKeyB64: device.offer.daemonPublicKeyB64 },
    capabilities: { selective_agent_timeline: true },
    reconnect: { enabled: true },
    connectTimeoutMs: 20_000,
    suppressSendErrors: true,
    logger: { debug: silent, info: silent, warn: silent, error: silent },
  });
  const api = createPaseoApi(driver);
  return {
    connect: async () => {
      await driver.connect();
      if (driver.getLastServerInfoMessage()?.serverId !== device.offer.serverId) {
        // The owner must observe the terminal fault before disposing. Closing here
        // emits "disconnected" first and could turn an identity failure into a retry.
        throw new RecoveryFault('identity', 'identity', true);
      }
    },
    close: () => driver.close(),
    verify: () => {
      if (driver.getLastServerInfoMessage()?.serverId !== device.offer.serverId)
        throw new RecoveryFault('identity', 'identity', true);
    },
    probe: () => driver.ping({ timeoutMs: 5_000 }),
    info: () => driver.getLastServerInfoMessage(),
    heartbeat: (payload: HeartbeatPayload) => driver.sendHeartbeat(payload),
    status: () => driver.getConnectionState().status,
    onStatus: driver.subscribeConnectionStatus.bind(driver),
    onEvent: driver.subscribe.bind(driver),
    directory: () =>
      api.agents.list({
        scope: 'active',
        page: { limit: 200 },
        subscribe: { subscriptionId: 'vibes-agents' },
      }),
    providers: () => api.providers.listAvailable(),
    models: (provider: PaseoAgentProvider, cwd: string) =>
      api.providers.listModels(provider, { cwd }),
    subscribe: (id: string) => driver.setAgentTimelineSubscription([id]),
    timeline: (
      id: string,
      direction: 'tail' | 'before' = 'tail',
      cursor?: NonNullable<TimelinePage['startCursor']>,
    ) =>
      api.agents
        .ref(id)
        .timeline.refetch({ direction, cursor, projection: 'canonical', limit: 200 }),
    refresh: (id: string) => api.agents.ref(id).refresh(),
    create: async (provider: string, cwd: string) => {
      driver.ensureConnected();
      const workspace = await api.workspaces.open(cwd);
      return workspace.agents.create({
        config: { provider },
        title: 'Vibes',
        labels: { source: 'vibes' },
      });
    },
    send: async (id: string, text: string, messageId: string) => {
      driver.ensureConnected();
      await api.agents.ref(id).send(text, { messageId });
    },
    cancel: async (id: string) => {
      driver.ensureConnected();
      await driver.cancelAgent(id);
    },
    permission: async (id: string, requestId: string, response: AgentPermissionResponse) => {
      driver.ensureConnected();
      await driver.respondToPermissionAndWait(id, requestId, response);
    },
  };
}
export type Connection = ReturnType<typeof createConnection>;
