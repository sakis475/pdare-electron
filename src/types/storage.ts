export interface StorageTypes {
  currentUser: User | null;
  connectionCode: string;
  version?: string;
}

export type StorageKey = keyof StorageTypes;
