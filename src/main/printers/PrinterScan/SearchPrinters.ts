const net = require("net");
const os = require("os");
const { exec } = require("child_process");
import { storage, STORAGE_KEYS } from "../../storage/StorageUtil";

export interface PrinterMap {
  [mac: string]: Printer;
}

interface ScanResult {
  ip: string;
  isOpen: boolean;
}

class SearchPrinters {
  private readonly TIMEOUT: number = 100; // Reduced timeout
  private readonly BATCH_SIZE: number = 128; // Number of simultaneous connections
  private readonly PRINTER_PORT: number = 9100; // Focus on main printer port

  public async loadPrinters(): Promise<PrinterMap> {
    try {
      const data = await storage.get(STORAGE_KEYS.PRINTERS_DATA);
      return data ? (data as PrinterMap) : {};
    } catch (error) {
      return {};
    }
  }

  private async savePrinters(printers: PrinterMap): Promise<void> {
    await storage.set(STORAGE_KEYS.PRINTERS_DATA, printers);
  }

  private async getMacAddress(ipAddress: string): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const command =
        process.platform === "win32"
          ? `arp -a ${ipAddress}`
          : `arp -n ${ipAddress}`;

      exec(command, (error: any, stdout: any) => {
        if (error) {
          resolve(null);
          return;
        }
        const macMatch =
          process.platform === "win32"
            ? stdout.match(/([0-9A-Fa-f]{2}-){5}([0-9A-Fa-f]{2})/)
            : stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);

        resolve(macMatch ? macMatch[0].toUpperCase() : null);
      });
    });
  }

  private testPort(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      let resolved = false;

      client.setTimeout(this.TIMEOUT);

      const finalizeTest = (result: boolean) => {
        if (!resolved) {
          resolved = true;
          client.destroy();
          resolve(result);
        }
      };

      client.on("connect", () => finalizeTest(true));
      client.on("error", () => finalizeTest(false));
      client.on("timeout", () => finalizeTest(false));

      client.connect({ port, host });
    });
  }

  private async scanIPBatch(ips: string[]): Promise<ScanResult[]> {
    const results = await Promise.all(
      ips.map((ip) =>
        this.testPort(ip, this.PRINTER_PORT).then((isOpen) => ({ ip, isOpen }))
      )
    );
    return results.filter((result) => result.isOpen);
  }

  private async processPrinterBatch(
    results: ScanResult[],
    savedPrinters: PrinterMap,
    foundPrinters: PrinterMap
  ): Promise<void> {
    const macPromises = results.map(async ({ ip }) => {
      const mac = await this.getMacAddress(ip);
      if (mac) {
        foundPrinters[mac] = {
          ip,
          port: this.PRINTER_PORT,
          mac,
          lastSeen: new Date().toISOString(),
          model: savedPrinters[mac]?.model || "Unknown",
        };
      }
    });

    await Promise.all(macPromises);
  }

  async scanNetwork(): Promise<PrinterMap> {
    try {
      const savedPrinters = await this.loadPrinters();
      const foundPrinters: PrinterMap = {};
      const interfaces = os.networkInterfaces();

      // Collect all valid IPv4 addresses to scan
      const networksToScan: string[][] = [];

      for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        if (iface) {
          for (const interfaceInfo of iface) {
            if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
              const baseIp = interfaceInfo.address
                .split(".")
                .slice(0, 3)
                .join(".");
              const networkIPs = Array.from(
                { length: 255 },
                (_, i) => `${baseIp}.${i + 1}`
              );
              networksToScan.push(networkIPs);
            }
          }
        }
      }

      // Scan each network in batches
      for (const networkIPs of networksToScan) {
        for (let i = 0; i < networkIPs.length; i += this.BATCH_SIZE) {
          const batch = networkIPs.slice(i, i + this.BATCH_SIZE);
          const results = await this.scanIPBatch(batch);
          await this.processPrinterBatch(results, savedPrinters, foundPrinters);
        }
      }

      // Update printer statuses
      const finalPrinters: PrinterMap = { ...savedPrinters };

      // Update found printers
      for (const [mac, printer] of Object.entries(foundPrinters)) {
        finalPrinters[mac] = {
          ...finalPrinters[mac],
          ...printer,
          online: true,
        };
      }

      // Mark not found printers as offline
      for (const mac of Object.keys(savedPrinters)) {
        if (!foundPrinters[mac]) {
          finalPrinters[mac] = {
            ...finalPrinters[mac],
            online: false,
          };
        }
      }

      await this.savePrinters(finalPrinters);
      return finalPrinters;
    } catch (error) {
      console.error("Scan error:", error);
      return {};
    }
  }
}

export default SearchPrinters;
