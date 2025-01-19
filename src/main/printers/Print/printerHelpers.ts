import { CharacterSet, PrinterTypes } from "node-thermal-printer";
import SearchPrinters from "../PrinterScan/SearchPrinters";
import OrderPrinterAdapter from "./Print";

const searchPrintersModule = new SearchPrinters();

export const printOrder = async (order: OrderIO) => {
  const printerToPrint = order.orderPrinters;
  console.log(printerToPrint, "printerToPrint");
  const localPrinters = await searchPrintersModule.loadPrinters();
  const availablePrinters = localPrinters ? Object.values(localPrinters) : [];

  for (const printer of printerToPrint) {
    const availablePrinter = availablePrinters.find(
      (e) => e.mac === printer.mac
    );
    if (availablePrinter) {
      const printerIP = printer.overrideIP ?? availablePrinter.ip;
      const printerPort =
        printer.overridePort || availablePrinter.port
          ? String(printer.overridePort ?? availablePrinter.port)
          : undefined;

      const characterSet: CharacterSet =
        printer.characterSet ?? CharacterSet.PC737_GREEK;

      const printerAdapter = new OrderPrinterAdapter({
        printerIP,
        printerPort,
        printerType: PrinterTypes.EPSON,
        characterSet,
      });

      console.log(printer, "printer");
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
