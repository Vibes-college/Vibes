import type { TimelinePage } from './timeline.ts';

export const operationKey = 'vibes.local-assistant.operations.v1';
export type OperationKind = 'send' | 'create' | 'permission' | 'cancel';
export interface PendingOperation {
  id: string;
  serverId: string;
  sessionId: string;
  kind: OperationKind;
  requestId?: string;
}
const idValid = (value: unknown) => typeof value === 'string' && value.length <= 1024;

// This is a pending-operation index, not an outbox: no payload and no resend method.
// Entries survive refresh until authoritative evidence or explicit user acknowledgement.
export class OperationLedger {
  private entries: PendingOperation[] = [];
  private storage: Storage;
  available = true;
  constructor(storage: Storage) {
    this.storage = storage;
    try {
      const raw = storage.getItem(operationKey);
      if (raw) {
        if (raw.length > 32768) throw new Error('invalid');
        const values: unknown = JSON.parse(raw);
        if (!Array.isArray(values) || values.length > 32) throw new Error('invalid');
        for (const value of values) {
          if (
            !value ||
            !idValid(value.id) ||
            !idValid(value.serverId) ||
            !idValid(value.sessionId) ||
            !['send', 'create', 'permission', 'cancel'].includes(value.kind) ||
            (value.requestId !== undefined && !idValid(value.requestId))
          )
            throw new Error('invalid');
          this.entries.push({
            id: value.id,
            serverId: value.serverId,
            sessionId: value.sessionId,
            kind: value.kind,
            ...(value.requestId ? { requestId: value.requestId } : {}),
          });
        }
      }
    } catch {
      this.available = false;
    }
  }
  pending(serverId: string, sessionId: string) {
    return this.entries.find(
      (entry) =>
        entry.serverId === serverId && (entry.kind === 'create' || entry.sessionId === sessionId),
    );
  }
  begin(entry: PendingOperation) {
    if (
      this.entries.length >= 32 ||
      !idValid(entry.id) ||
      !idValid(entry.serverId) ||
      !idValid(entry.sessionId) ||
      (entry.requestId !== undefined && !idValid(entry.requestId))
    )
      return false;
    const safe: PendingOperation = {
      id: entry.id,
      serverId: entry.serverId,
      sessionId: entry.sessionId,
      kind: entry.kind,
      ...(entry.requestId ? { requestId: entry.requestId } : {}),
    };
    if (new TextEncoder().encode(JSON.stringify([...this.entries, safe])).byteLength > 32768)
      return false;
    this.entries.push(safe);
    this.save();
    return true;
  }
  resolve(id: string) {
    this.entries = this.entries.filter((entry) => entry.id !== id);
    this.save();
  }
  reconcile(serverId: string, page: TimelinePage) {
    const resolved: string[] = [];
    this.entries = this.entries.filter((entry) => {
      if (
        entry.serverId !== serverId ||
        entry.sessionId !== page.agentId ||
        !page.agent ||
        page.error
      )
        return true;
      const known =
        (entry.kind === 'send' &&
          page.entries.some(
            (row) =>
              row.item.type === 'user_message' &&
              (row.item.messageId === entry.id || row.item.clientMessageId === entry.id),
          )) ||
        (entry.kind === 'permission' &&
          !page.agent.pendingPermissions.some((p) => p.id === entry.requestId)) ||
        (entry.kind === 'cancel' && !['running', 'initializing'].includes(page.agent.status));
      if (known) resolved.push(entry.id);
      return !known;
    });
    if (resolved.length) this.save();
    return resolved;
  }
  clear() {
    this.entries = [];
    try {
      this.storage.removeItem(operationKey);
      this.available = true;
    } catch {
      this.available = false;
    }
  }
  private save() {
    try {
      this.storage.setItem(operationKey, JSON.stringify(this.entries));
      this.available = true;
    } catch {
      this.available = false;
    }
  }
}
