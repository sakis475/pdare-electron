import { storage, STORAGE_KEYS } from "../storage/StorageUtil";
import { getConnectionCode } from "../utils/requests";

// Constants for storage keys

interface ConnectionResponse {
  // Add specific response type properties here
  [key: string]: any;
}

export interface StoredConnectionData {
  data: ConnectionResponse;
  timestamp: number;
}

export class ConnectionBridge {
  public async fetchAndStoreConnection(
    email: string,
    password: string
  ): Promise<ConnectionResponse> {
    try {
      // Get connection data from API
      const connectionData = await getConnectionCode(email, password);

      // Prepare data for storage with timestamp
      const storedData: StoredConnectionData = {
        data: connectionData,
        timestamp: Date.now(),
      };

      // Store in localStorage
      storage.set(STORAGE_KEYS.CONNECTION_DATA, storedData);

      return connectionData;
    } catch (error) {
      console.error("Error in fetchAndStoreConnection:", error);
      throw error;
    }
  }

  public getStoredConnection(): StoredConnectionData | undefined {
    return storage.get<StoredConnectionData>(STORAGE_KEYS.CONNECTION_DATA);
  }

  public hasValidConnection(maxAge?: number): boolean {
    const storedData = this.getStoredConnection();

    if (!storedData) return false;

    if (maxAge) {
      const age = Date.now() - storedData.timestamp;
      return age <= maxAge;
    }

    return true;
  }

  public clearConnection(): void {
    storage.delete(STORAGE_KEYS.CONNECTION_DATA);
  }
}

// Export a singleton instance
export const connectionBridge = new ConnectionBridge();
