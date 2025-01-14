import { StorageKey } from "./storage";

declare global {
  interface Window {
    api: {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, callback: (data: any) => void) => void;
      storage: {
        get: (key: StorageKey) => Promise<any>;
        set: (key: StorageKey, value: any) => Promise<void>;
        delete: (key: StorageKey) => Promise<void>;
        clear: () => Promise<void>;
      };
    };
  }
}
