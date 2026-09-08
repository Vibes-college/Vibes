import type { ConnectionOffer } from '@getpaseo/protocol/connection-offer';

export interface SavedDevice {
  offer: ConnectionOffer;
  clientId: string;
  selectedId?: string;
}
export const deviceKey = 'vibes.local-assistant.v1';
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parsePairing(input: string): ConnectionOffer {
  if (!input.trim() || input.length > 10_000) throw new Error('pairing');
  let decoded = input.trim();
  if (!decoded.startsWith('{')) {
    const url = new URL(decoded);
    if (url.protocol !== 'https:') throw new Error('pairing');
    const encoded = new URLSearchParams(url.hash.slice(1)).get('offer');
    if (!encoded || !/^[A-Za-z0-9_-]+=*$/.test(encoded)) throw new Error('pairing');
    decoded = new TextDecoder().decode(
      Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    );
  }
  const value: unknown = JSON.parse(decoded);
  if (
    !record(value) ||
    value.v !== 2 ||
    typeof value.serverId !== 'string' ||
    !/^[A-Za-z0-9_-]{1,512}$/.test(value.serverId) ||
    typeof value.daemonPublicKeyB64 !== 'string' ||
    !/^[A-Za-z0-9+/]{43}=$/.test(value.daemonPublicKeyB64) ||
    atob(value.daemonPublicKeyB64).length !== 32 ||
    !record(value.relay) ||
    !['relay.paseo.sh:443', 'relay.paseo.sh'].includes(String(value.relay.endpoint)) ||
    (value.relay.useTls !== undefined && value.relay.useTls !== true)
  )
    throw new Error('pairing');
  return {
    v: 2,
    serverId: value.serverId,
    daemonPublicKeyB64: value.daemonPublicKeyB64,
    relay: { endpoint: String(value.relay.endpoint), useTls: true },
  };
}
export function forgetDevice(tab: Storage, local: Storage) {
  let failed = false;
  for (const storage of [tab, local]) {
    try {
      storage.removeItem(deviceKey);
    } catch {
      failed = true;
    }
  }
  if (failed) throw new Error('storage');
}
export function saveDevice(device: SavedDevice, remember: boolean, tab: Storage, local: Storage) {
  forgetDevice(tab, local);
  (remember ? local : tab).setItem(deviceKey, JSON.stringify(device));
}
export function readDevice(tab: Storage, local: Storage): SavedDevice | null {
  try {
    const raw = tab.getItem(deviceKey) ?? local.getItem(deviceKey);
    if (!raw || raw.length > 12_000) return null;
    const value: unknown = JSON.parse(raw);
    if (!record(value) || typeof value.clientId !== 'string' || value.clientId.length > 128)
      return null;
    return {
      offer: parsePairing(JSON.stringify(value.offer)),
      clientId: value.clientId,
      ...(typeof value.selectedId === 'string' && value.selectedId.length < 512
        ? { selectedId: value.selectedId }
        : {}),
    };
  } catch {
    return null;
  }
}
