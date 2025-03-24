import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";
import dayjs from "../../utils/dayjs";

interface PrinterConfig {
  printerIP: string;
  printerPort?: string | null;
  printerType?: PrinterTypes;
  characterSet?: CharacterSet;
  timeout?: number;
}

interface PrinterTemplate {
  textSettings?: {
    textSize?: "A" | "B" | "C" | "D";
    fontType?: "A" | "B";
  };
  header?: {
    subtitle?: string;
    extraLines?: string[];
  };
  orderInfo?: {
    showOrderNumber?: boolean;
    showDate?: boolean;
    showTime?: boolean;
    showTable?: boolean;
    showServer?: boolean;
    orderNumberLabel?: string;
    datePrint?: string;
    dateLabel?: string;
    timeLabel?: string;
    tableLabel?: string;
    serverLabel?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
  orderTitle?: string;
  items?: {
    couvertText?: string;
  };
  totals?: {
    totalLabel?: string;
  };
  footer?: {
    lines?: string[];
  };
}

const defaultTemplate: PrinterTemplate = {
  textSettings: {
    textSize: "B",
    fontType: "A",
  },
  orderInfo: {
    showOrderNumber: true,
    showDate: true,
    showTime: true,
    showTable: true,
    showServer: true,
    orderNumberLabel: "Αριθμός Παραγγελίας",
    datePrint: "Ημ. Εκτύπωσης",
    dateLabel: "Ημερομηνία",
    timeLabel: "Ώρα",
    tableLabel: "Τραπέζι",
    serverLabel: "Σερβιτόρος",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm:ss",
  },
  orderTitle: "ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ",
  items: {
    couvertText: "Κουβέρ",
  },
  totals: {
    totalLabel: "ΣΥΝΟΛΟ",
  },
  footer: {
    lines: [],
  },
};

class OrderPrinterAdapter {
  private config: Required<PrinterConfig>;
  private printer: ThermalPrinter;
  private currency: string = "€";
  private template: PrinterTemplate;

  constructor(config: PrinterConfig, template?: PrinterTemplate) {
    this.config = {
      printerIP: config.printerIP,
      printerPort: config.printerPort ? config.printerPort : null,
      printerType: config.printerType || PrinterTypes.EPSON,
      characterSet: config.characterSet || CharacterSet.PC737_GREEK,
      timeout: config.timeout || 5000,
    };

    this.template = { ...defaultTemplate, ...template };

    const interfaceprinter = `tcp://${this.config.printerIP}${
      this.config.printerPort ? ":" + this.config.printerPort : ""
    }`;
    this.printer = new ThermalPrinter({
      type: this.config.printerType,
      interface: interfaceprinter,
      characterSet: this.config.characterSet,
      removeSpecialCharacters: false,
      options: { timeout: this.config.timeout },
    });
  }

  private tranformText(text: string) {
    text = text.normalize("NFD");

    text = text.replace(/[\u0300-\u036f]/g, "");

    text = text.toUpperCase();

    return text;
  }

  private printLn(text: string) {
    text = this.tranformText(text);
    this.printer.println(text);
  }

  private printItemLine(text: string, price: string): void {
    text = this.tranformText(text);

    this.printer.leftRight(text, price);
  }

  private drawLine(printType: PrintType): void {
    this.printer.setTextNormal();
    this.printer.drawLine();
    if (printType === "personel") {
      this.setDefaultTextSize();
    }
  }

  private drawDot(): void {
    this.printer.alignCenter();
    this.printer.println("");
    this.printer.alignLeft();
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const format = this.template.orderInfo?.dateFormat || "dd/MM/yyyy";
    return format
      .replace("dd", date.getDate().toString().padStart(2, "0"))
      .replace("MM", (date.getMonth() + 1).toString().padStart(2, "0"))
      .replace("yyyy", date.getFullYear().toString());
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const format = this.template.orderInfo?.timeFormat || "HH:mm:ss";
    return dayjs(date).format(format);
  }

  private printItems(
    orderItems: OrderItemIO[],
    couvert: number,
    printType: PrintType,
    restaurant: Restaurant | undefined
  ): void {
    // Print title only for final print
    if (printType === "final") {
      this.printer.alignCenter();
      this.printer.setTextDoubleHeight();
      this.printer.setTextDoubleWidth();
      this.printer.bold(true);
      this.printLn(this.template.orderTitle || "ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ");
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.alignLeft();
      this.drawLine(printType);
    }

    const couvertCost =
      typeof restaurant?.couvertCost === "string"
        ? (parseFloat(restaurant.couvertCost) * couvert).toFixed(2)
        : typeof restaurant?.couvertCost === "number"
        ? (restaurant.couvertCost * couvert).toFixed(2)
        : "0.00";

    // Print Couvert
    if (couvert > 0) {
      const couvertText = this.template.items?.couvertText || "Κουβέρ";
      if (printType === "final") {
        this.printItemLine(
          `${couvert}x ${couvertText}`,
          `${couvertCost}${this.currency}`
        );
        this.drawDot();
      } else {
        this.printLn(`${couvert}x ${couvertText}`);
        this.drawDot();
      }
    }
    // Print items
    orderItems.forEach((item) => {
      const text = `${item.quantity}x ${item.item.title}`;

      if (printType === "final") {
        const total = item.item.cost * item.quantity;
        const price = `${total.toFixed(2)}${this.currency}`;

        // For final print, use two columns with price
        const maxLength = 32;
        if (text.length > maxLength) {
          const lines =
            text.match(new RegExp(`.{1,${maxLength}}(?:\\s|$)`, "g")) || [];
          lines.forEach((line, index) => {
            if (index === lines.length - 1) {
              this.printItemLine(line.trim(), price);
            } else {
              this.printLn(line.trim());
            }
          });
        } else {
          this.printItemLine(text, price);
        }
      } else {
        // For personnel print, use full width
        this.printLn(text);
      }

      // Print properties
      if (item.itemPropertyOfItem.length > 0) {
        item.itemPropertyOfItem.forEach((prop) => {
          const propText = `  - ${prop.itemProperty.propertyValue}`;
          this.printLn(propText);
        });
      }

      // Print comment
      if (item.comment) {
        this.printLn(`  * ${item.comment}`);
      }

      this.drawDot();
    });
  }

  private printHeader(
    restaurant: Restaurant | undefined,
    printType: PrintType
  ): void {
    if (!restaurant || printType === "personel") {
      this.printer.setTextNormal();
      this.printLn(
        `${this.template.orderInfo?.datePrint} ${this.formatDate(
          dayjs().toString()
        )} ${this.formatTime(dayjs().toString())}`
      );
      this.setDefaultTextSize();
      return;
    }

    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.setTextDoubleWidth();
    this.printer.bold(true);
    this.printLn(restaurant.restaurantName);
    this.printer.bold(false);
    this.printer.setTextNormal();

    if (this.template.header?.subtitle) {
      this.printLn(this.template.header.subtitle);
    }

    if (this.template.header?.extraLines) {
      this.template.header.extraLines.forEach((line) => {
        this.printLn(line);
      });
    }

    this.drawLine(printType);
  }

  private printOrderInfo(order: OrderIO): void {
    this.printer.alignLeft();
    const info = this.template.orderInfo || {};

    if (info.showOrderNumber && order.uniqueId) {
      this.printLn(
        `${info.orderNumberLabel || "Αριθμός Παραγγελίας"}: ${order.uniqueId}`
      );
    }
    if (info.showDate && order.createdAt) {
      this.printLn(
        `${info.dateLabel || "Ημερομηνία"}: ${this.formatDate(order.createdAt)}`
      );
    }
    if (info.showTime && order.createdAt) {
      this.printLn(
        `${info.timeLabel || "Ώρα"}: ${this.formatTime(order.createdAt)}`
      );
    }
    if (info.showTable) {
      this.printLn(`${info.tableLabel || "Τραπέζι"}: ${order.table.tableName}`);
    }
    if (info.showServer && order.user?.displayName) {
      this.printLn(
        `${info.serverLabel || "Σερβιτόρος"}: ${order.user.displayName}`
      );
    }

    this.drawLine(order.printType);

    if (order.printType === "personel") {
      this.drawDot();
      this.drawDot();
    }
  }

  private printTotals(final: number, printType: PrintType): void {
    if (printType === "personel") return;

    this.drawLine(printType);
    this.printer.bold(true);
    const totalLabel = this.template.totals?.totalLabel || "ΣΥΝΟΛΟ";
    this.printItemLine(`${totalLabel}:`, `${final.toFixed(2)}${this.currency}`);
    this.printer.bold(false);
  }

  private printFooter(printType: PrintType): void {
    this.drawLine(printType);

    if (printType === "final") {
      this.printer.alignCenter();
      if (this.template.footer?.lines) {
        this.template.footer.lines.forEach((line) => {
          this.printLn(line);
        });
      }
    }

    this.drawDot();
    this.drawDot();

    this.printer.cut();
  }

  private setDefaultTextSize() {
    switch (this.template?.textSettings?.textSize) {
      case "A":
        this.printer.setTextSize(0, 0);
        break;
      case "B":
        this.printer.setTextDoubleHeight();
        this.printer.setTextDoubleWidth();
        break;
      case "C":
        this.printer.setTextSize(1, 1);
        break;
      case "D":
        this.printer.setTextSize(2, 2);
        break;
      default:
        this.printer.setTextSize(1, 1);
        break;
    }
    switch (this.template.textSettings?.fontType) {
      case "A":
        this.printer.setTypeFontA();
        break;
      case "B":
        this.printer.setTypeFontB();
        break;
      default:
        this.printer.setTypeFontB();
        break;
    }
  }

  async printOrder(
    order: OrderIO & { printType: PrintType },
    orderItems: OrderItemIO[]
  ): Promise<boolean> {
    try {
      if (!orderItems?.length) return false;
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error("Printer not connected");
      }

      this.currency = order.user?.restaurant?.currencySymbol
        ? order.user?.restaurant?.currencySymbol
        : "€";

      if (order.printType === "personel") {
        this.setDefaultTextSize();
      }

      this.drawDot();
      this.drawDot();

      this.printHeader(order.user?.restaurant, order.printType);
      this.printOrderInfo(order);
      this.printItems(
        orderItems,
        order.couvert,
        order.printType,
        order.user?.restaurant
      );
      this.printTotals(order.finalCost, order.printType);
      this.printFooter(order.printType);

      this.printer.setTextNormal();

      await this.printer.execute();
      return true;
    } catch (error) {
      console.error(
        "Printing error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }
}

export default OrderPrinterAdapter;
