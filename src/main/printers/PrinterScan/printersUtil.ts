import SearchPrinters from "./SearchPrinters";

export async function findPrinters() {
  //   Create an instance of the printer scanner
  const printerScanner = new SearchPrinters();
  try {
    console.log("Starting printer scan...");
    const printers = await printerScanner.scanNetwork();

    console.log("\nFound Printers:");
    for (const [mac, printer] of Object.entries(printers)) {
      console.log(`
            Nickname: ${printer.nickname}
            IP: ${printer.ip}
            MAC: ${mac}
            Status: ${printer.online ? "Online" : "Offline"}
            Model: ${printer.model}
            Last Seen: ${printer.lastSeen}
          `);
    }
    return printers;
  } catch (error) {
    console.error("Error scanning printers:", error);
  }
}

// Example with periodic scanning
export async function monitorPrinters(intervalMinutes: number = 5) {
  //   const printerScanner = new SearchPrinters();
  //   // Initial scan
  //   await findPrinters();
  //   // Set up periodic scanning
  //   setInterval(async () => {
  //     console.log("\nPerforming periodic printer scan...");
  //     await findPrinters();
  //   }, intervalMinutes * 60 * 1000);
}
