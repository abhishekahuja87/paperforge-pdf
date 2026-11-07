import type { PosProfileFile } from './types';
import { parsePosJson } from './workspace';

const DATABASE = 'mydailyutils-pos';
const STORE = 'profiles';

export interface SavedProfile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  profile: PosProfileFile;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onblocked = () => {
      blocked = true;
      reject(new Error('Browser storage is blocked by another open tab.'));
    };
    request.onerror = () => reject(request.error ?? new Error('Could not open browser storage.'));
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
  });
}

function readRecord(value: unknown): SavedProfile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('A saved profile is invalid.');
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string'
    || typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string'
    || Number.isNaN(Date.parse(record.updatedAt))) throw new Error('A saved profile is invalid.');
  const serialized = JSON.stringify(record.profile);
  if (serialized === undefined) throw new Error('A saved profile is invalid.');
  const imported = parsePosJson(serialized);
  if (imported.kind !== 'profile') throw new Error('A saved profile is invalid.');
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    profile: {
      schema: 'mydailyutils.pos-profile',
      version: 1,
      store: imported.store,
      inventory: imported.inventory,
      exportedAt: record.updatedAt,
    },
  };
}

async function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, setResult: (result: T) => void, fail: (reason: Error) => void) => void,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let result: T;
      let failure: Error | undefined;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('Browser storage operation failed.'));
      tx.onerror = () => { failure = tx.error ?? new Error('Browser storage operation failed.'); };
      const fail = (reason: Error) => {
        failure = reason;
        tx.abort();
      };
      try {
        run(tx.objectStore(STORE), (value) => { result = value; }, fail);
      } catch (reason) {
        fail(reason instanceof Error ? reason : new Error('Browser storage operation failed.'));
      }
    });
  } finally {
    db.close();
  }
}

export function listSavedProfiles(): Promise<SavedProfile[]> {
  return transact('readonly', (store, setResult, fail) => {
    const request = store.getAll();
    request.onsuccess = () => {
      try {
        setResult(request.result.map(readRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      } catch (reason) {
        fail(reason instanceof Error ? reason : new Error('A saved profile is invalid.'));
      }
    };
  });
}

export function getSavedProfile(id: string): Promise<SavedProfile> {
  return transact('readonly', (store, setResult, fail) => {
    const request = store.get(id);
    request.onsuccess = () => {
      try {
        if (request.result === undefined) throw new Error('The saved profile no longer exists.');
        setResult(readRecord(request.result));
      } catch (reason) {
        fail(reason instanceof Error ? reason : new Error('A saved profile is invalid.'));
      }
    };
  });
}

export function saveNewProfile(profile: PosProfileFile): Promise<SavedProfile> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record: SavedProfile = { id, name: `${profile.store.name.trim()} · ${now.slice(0, 10)} · ${id}`, createdAt: now, updatedAt: now, profile };
  return transact('readwrite', (store, setResult) => {
    store.add(record);
    setResult(record);
  });
}

export function replaceSavedProfile(id: string, profile: PosProfileFile): Promise<SavedProfile> {
  return transact('readwrite', (store, setResult, fail) => {
    const request = store.get(id);
    request.onsuccess = () => {
      try {
        if (request.result === undefined) throw new Error('The saved profile no longer exists. Refresh the list and try again.');
        const existing = readRecord(request.result);
        const record = { ...existing, name: `${profile.store.name.trim()} · ${existing.createdAt.slice(0, 10)} · ${existing.id}`, updatedAt: new Date().toISOString(), profile };
        store.put(record);
        setResult(record);
      } catch (reason) {
        fail(reason instanceof Error ? reason : new Error('Could not replace the saved profile.'));
      }
    };
  });
}

export function deleteSavedProfile(id: string): Promise<void> {
  return transact('readwrite', (store, setResult) => {
    store.delete(id);
    setResult(undefined);
  });
}
