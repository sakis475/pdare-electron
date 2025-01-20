import { CharacterSet, PrinterTypes } from "node-thermal-printer";
import SearchPrinters from "../PrinterScan/SearchPrinters";
import OrderPrinterAdapter from "./Print";

const searchPrintersModule = new SearchPrinters();

enum PrintType {
  PERSONEL = "personel",
  FINAL = "final",
}

export const printOrder = async (order: OrderIO) => {
  const printerToPrint = order.orderPrinters;
  console.log(printerToPrint, "printerToPrint");
  const localPrinters = await searchPrintersModule.loadPrinters();
  const availablePrinters = localPrinters ? Object.values(localPrinters) : [];
  console.log(availablePrinters, "availablePrinters");
  for (const printer of printerToPrint) {
    if (
      order.printType === PrintType.PERSONEL &&
      !!order.orderPrinters?.length
    ) {
      continue;
    }
    const availablePrinter = availablePrinters.find(
      (e) => e.mac === printer.mac
    );
    if (availablePrinter) {
      const printerIP = printer.overrideIP
        ? printer.overrideIP
        : availablePrinter.ip;

      const printerPort = printer.overridePort
        ? printer.overridePort
        : availablePrinter.port;

      const portString = printerPort ? String(printerPort) : undefined;
      const characterSet = printer.characterSet
        ? printer.characterSet
        : CharacterSet.PC737_GREEK;

      const printerAdapter = new OrderPrinterAdapter({
        printerIP,
        printerPort: portString,
        printerType: PrinterTypes.EPSON,
        characterSet,
      });

      const success = await printerAdapter.printOrder(
        order,
        printer.orderItems
      );

      if (success) {
        console.log("Order printed successfully");
      } else {
        console.log("Failed to print order");
      }
    }
  }

  console.log("[Main] Receive Order To Print", order);
};
