// IndexedDB-backed offline outbox for write operations
// Focused initial implementation for walking sessions

import { openDB, IDBPDatabase } from 'idb';

export type EntityType = 'walking_session' | 'food_entry' | 'fasting_session';
export type ActionType = 'start' | 'pause' | 'resume' | 'end' | 'cancel' | 'update_speed' | 'create' | 'update' | 'delete';

export interface OutboxOperation {
  id: string;
  entity: EntityType;
  action: ActionType;
  user_id: string;
  payload: any;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

interface IdMapping {
  localId: string;
  serverId: string;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB('fastnow_outbox', 2, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('mappings')) {
          db.createObjectStore('mappings', { keyPath: 'localId' });
        }
        
        // V2: Add indexes for better performance
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('operations')) {
            const opStore = db.transaction(['operations'], 'readwrite').objectStore('operations');
            if (!opStore.indexNames.contains('entity-action')) {
              opStore.createIndex('entity-action', ['entity', 'action']);
            }
            if (!opStore.indexNames.contains('createdAt')) {
              opStore.createIndex('createdAt', 'createdAt');
            }
          }
        }
      },
    });
  }
  return dbPromise;
};

const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);

export const enqueueOperation = async (op: Omit<OutboxOperation, 'id' | 'createdAt' | 'attempts'>) => {
  const db = await getDB();
  const record: OutboxOperation = {
    id: uuid(),
    createdAt: Date.now(),
    attempts: 0,
    ...op,
  };
  await db.add('operations', record);
  dispatchOutboxEvent('changed');
  return record.id;
};

export const listOperations = async (): Promise<OutboxOperation[]> => {
  const db = await getDB();
  const all = await db.getAll('operations');
  return all.sort((a, b) => a.createdAt - b.createdAt);
};

export const updateOperation = async (op: OutboxOperation) => {
  const db = await getDB();
  await db.put('operations', op);
};

export const removeOperation = async (id: string) => {
  const db = await getDB();
  await db.delete('operations', id);
  dispatchOutboxEvent('changed');
};

export const clearOutbox = async () => {
  const db = await getDB();
  await db.clear('operations');
  dispatchOutboxEvent('changed');
};

export const getPendingCount = async (): Promise<number> => {
  const db = await getDB();
  return (await db.getAllKeys('operations')).length;
};

export const setIdMapping = async (localId: string, serverId: string) => {
  const db = await getDB();
  const mapping: IdMapping = { localId, serverId, createdAt: Date.now() };
  await db.put('mappings', mapping);
};

export const resolveMappedId = async (maybeLocalId?: string | null): Promise<string | undefined> => {
  if (!maybeLocalId) return undefined;
  if (!maybeLocalId.startsWith('local-')) return maybeLocalId;
  const db = await getDB();
  const mapping = await db.get('mappings', maybeLocalId);
  return mapping?.serverId ?? maybeLocalId;
};

export const dispatchOutboxEvent = (type: 'changed' | 'sync-start' | 'sync-complete') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`outbox:${type}`));
    // Backwards-compat event alias
    if (type === 'sync-complete') {
      window.dispatchEvent(new CustomEvent('outbox:sync'));
    }
  }
};
