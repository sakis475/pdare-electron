export interface StorageTypes {
  currentUser: User | null;
  connectionCode: string;
  version?: string;
}

type StorageKey = keyof StorageTypes;

export async function setStorage<K extends StorageKey>(
  key: K,
  value: StorageTypes[K] | null
): Promise<void> {
  if (!window.api?.storage) {
    throw new Error("Storage API not available");
  }
  try {
    await window.api.storage.set(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in storage:`, error);
    throw error;
  }
}

export async function getStorage<K extends StorageKey>(
  key: K
): Promise<StorageTypes[K] | null> {
  if (!window.api?.storage) {
    throw new Error("Storage API not available");
  }
  try {
    const value = await window.api.storage.get(key);
    return value ?? null;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    throw error;
  }
}

export async function removeItemStorage(key: StorageKey): Promise<void> {
  if (!window.api?.storage) {
    throw new Error("Storage API not available");
  }
  try {
    await window.api.storage.delete(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    throw error;
  }
}

export async function removeAllStorage(): Promise<void> {
  if (!window.api?.storage) {
    throw new Error("Storage API not available");
  }
  try {
    await window.api.storage.clear();
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw error;
  }
}
