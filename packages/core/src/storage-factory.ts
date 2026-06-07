import { TursoJournalismStorage } from './journalism/turso-storage';
import type { JournalismStorage } from './journalism/storage';
import type { StorageConfig } from './journalism/storage';

let storageInstance: JournalismStorage | null = null;

export function getStorage(config?: StorageConfig): JournalismStorage {
  if (storageInstance) return storageInstance;
  
  const url = config?.url || process.env.TURSO_DATABASE_URL || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL || '';
  const authToken = config?.authToken || process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN || '';
  
  if (!url || !authToken) {
    throw new Error('Turso credentials not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  }
  
  storageInstance = new TursoJournalismStorage({ url, authToken });
  return storageInstance;
}

export function resetStorage() {
  storageInstance = null;
}