interface Window {
  api: {
    send: (channel: string, data?: any) => void;
    receive: (channel: string, callback: (data: any) => void) => void;
    storage: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
      delete: (key: string) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
}
