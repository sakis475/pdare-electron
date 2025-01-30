import { CharacterSet, PrinterTypes } from "node-thermal-printer";
import SearchPrinters from "../PrinterScan/SearchPrinters";
import OrderPrinterAdapter from "./Print";
import { findPrinters } from "../PrinterScan/printersUtil";

const searchPrintersModule = new SearchPrinters();

enum PrintType {
  PERSONEL = "personel",
  FINAL = "final",
}

export const printOrder = async (order: OrderIO) => {
  const printerToPrint = order.orderPrinters;
  const localPrinters = await searchPrintersModule.loadPrinters();
  const availablePrinters = localPrinters ? Object.values(localPrinters) : [];
  console.log(availablePrinters, "availablePrinters");
  for (const printer of printerToPrint) {
    if (!order.orderPrinters?.length) {
      //If no printer in order skip
      continue;
    }
    if (!printer.orderItems?.length) {
      //If no orderItems for this printer skip
      continue;
    }
    let availablePrinter = availablePrinters.find((e) => e.mac === printer.mac);

    if (!availablePrinter) {
      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Printer search timeout")), 10000);
      });

      try {
        // Race between the printer search and the timeout
        const printersNow = await Promise.race([
          findPrinters(),
          timeoutPromise,
        ]);

        const availablePrintersSearched = printersNow
          ? Object.values(printersNow)
          : [];

        availablePrinter = availablePrintersSearched.find(
          (e) => e.mac === printer.mac
        );
      } catch {
        console.warn("Printer search failed");
        availablePrinter = undefined;
      }
    }
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

      const templateGreek = {
        orderInfo: {
          showOrderNumber: true,
          showDate: true,
          showTime: true,
          showTable: true,
          showServer: true,
          orderNumberLabel: "Αριθμός Παραγγελίας",
          dateLabel: "Ημερομηνία",
          timeLabel: "Ώρα",
          tableLabel: "Τραπέζι",
          serverLabel: "Σερβιτόρος",
          dateFormat: "dd/MM/yyyy",
          timeFormat: "HH:mm",
        },
        orderTitle: "ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ",
        items: {
          couvertText: "Κουβέρ",
        },
        totals: {
          totalLabel: "ΣΥΝΟΛΟ",
        },
      };

      const templateEnglish = {
        orderInfo: {
          showOrderNumber: true,
          showDate: true,
          showTime: true,
          showTable: true,
          showServer: true,
          orderNumberLabel: "Order Number",
          dateLabel: "Date",
          timeLabel: "Time",
          tableLabel: "Table",
          serverLabel: "Waiter",
          dateFormat: "MM/dd/yyyy",
          timeFormat: "HH:mm",
        },
        orderTitle: "ORDER ANALYSIS",
        items: {
          couvertText: "Couvert",
        },
        totals: {
          totalLabel: "TOTAL",
        },
      };

      const printerAdapter = new OrderPrinterAdapter(
        {
          printerIP,
          printerPort: portString,
          printerType: PrinterTypes.EPSON,
          characterSet,
        },
        order.user.restaurant?.restaurantLanguage === "lang_en"
          ? templateEnglish
          : templateGreek
      );
      const success = await printerAdapter.printOrder(
        order,
        printer.orderItems
      );

      if (success) {
        console.log("Order printed successfully");
      } else {
        console.log("Failed to print order");
      }
    } else {
      console.log("Skipped", printer);
    }
  }

  console.log("[Main] Receive Order To Print", order);
};
