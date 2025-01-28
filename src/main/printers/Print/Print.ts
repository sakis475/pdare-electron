import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";

interface PrinterConfig {
  printerIP: string;
  printerPort?: string | null;
  printerType?: PrinterTypes;
  characterSet?: CharacterSet;
  timeout?: number;
}

interface PrinterTemplate {
  header?: {
    // Restaurant name is always at the top
    subtitle?: string; // Optional text under restaurant name
    extraLines?: string[]; // Additional lines at end of header
  };
  orderInfo?: {
    showOrderNumber?: boolean;
    showDate?: boolean;
    showTime?: boolean;
    showTable?: boolean;
    showServer?: boolean;
    // Text customization
    orderNumberLabel?: string; // Default: "Αριθμός Παραγγελίας"
    dateLabel?: string; // Default: "Ημερομηνία"
    timeLabel?: string; // Default: "Ώρα"
    tableLabel?: string; // Default: "Τραπέζι"
    serverLabel?: string; // Default: "Σερβιτόρος"
    dateFormat?: string; // Default: "dd/MM/yyyy"
    timeFormat?: string; // Default: "HH:mm"
  };
  orderTitle?: string; // Title above items (default: "ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ")
  items?: {
    couvertText?: string; // Default: "Κουβέρ"
  };
  totals?: {
    totalLabel?: string; // Default: "ΣΥΝΟΛΟ"
  };
  footer?: {
    lines?: string[]; // Footer text lines (default thank you message)
  };
}

// Default template
const defaultTemplate: PrinterTemplate = {
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
    const format = this.template.orderInfo?.timeFormat || "HH:mm";
    return format
      .replace("HH", date.getHours().toString().padStart(2, "0"))
      .replace("mm", date.getMinutes().toString().padStart(2, "0"));
  }

  private printItemLine(text: string, price: string): void {
    this.printer.leftRight(text, price);
  }

  private printItems(orderItems: OrderItemIO[], couvert: number): void {
    // Print title
    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.setTextDoubleWidth();
    this.printer.bold(true);
    this.printer.println(this.template.orderTitle || "ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ");
    this.printer.bold(false);
    this.printer.setTextNormal();
    this.printer.alignLeft();
    this.printer.drawLine();

    // Print Couvert
    if (couvert > 0) {
      const couvertText = this.template.items?.couvertText || "Κουβέρ";
      const text = `${couvert}x ${couvertText}`;
      const price = `${couvert.toFixed(2)}${this.currency}`;
      this.printItemLine(text, price);
    }

    // Print items
    orderItems.forEach((item) => {
      const total = item.item.cost * item.quantity;
      const text = `${item.quantity}x ${item.item.title}`;
      const price = `${total.toFixed(2)}${this.currency}`;

      // Handle long text
      const maxLength = 32;
      if (text.length > maxLength) {
        const lines =
          text.match(new RegExp(`.{1,${maxLength}}(?:\\s|$)`, "g")) || [];
        lines.forEach((line, index) => {
          if (index === lines.length - 1) {
            this.printItemLine(line.trim(), price);
          } else {
            this.printer.println(line.trim());
          }
        });
      } else {
        this.printItemLine(text, price);
      }

      // Print properties
      if (item.itemPropertyOfItem.length > 0) {
        item.itemPropertyOfItem.forEach((prop) => {
          const propText = `  - ${prop.itemProperty.propertyName}: ${prop.itemProperty.propertyValue}`;
          this.printer.println(propText);
        });
      }

      // Print comment
      if (item.comment) {
        this.printer.println(`  * ${item.comment}`);
      }
    });
  }

  private printHeader(restaurant: Restaurant | undefined): void {
    if (!restaurant) return;

    this.printer.alignCenter();

    // Restaurant name
    this.printer.setTextDoubleHeight();
    this.printer.setTextDoubleWidth();
    this.printer.bold(true);
    this.printer.println(restaurant.restaurantName);
    this.printer.bold(false);
    this.printer.setTextNormal();

    // Subtitle if specified
    if (this.template.header?.subtitle) {
      this.printer.println(this.template.header.subtitle);
    }

    // Extra header lines
    if (this.template.header?.extraLines) {
      this.template.header.extraLines.forEach((line) => {
        this.printer.println(line);
      });
    }

    this.printer.drawLine();
  }

  private printOrderInfo(order: OrderIO): void {
    this.printer.alignLeft();

    const info = this.template.orderInfo || {};

    if (info.showOrderNumber && order.uniqueId) {
      this.printer.println(
        `${info.orderNumberLabel || "Αριθμός Παραγγελίας"}: #${order.uniqueId}`
      );
    }
    if (info.showDate && order.createdAt) {
      this.printer.println(
        `${info.dateLabel || "Ημερομηνία"}: ${this.formatDate(order.createdAt)}`
      );
    }
    if (info.showTime && order.createdAt) {
      this.printer.println(
        `${info.timeLabel || "Ώρα"}: ${this.formatTime(order.createdAt)}`
      );
    }
    if (info.showTable) {
      this.printer.println(
        `${info.tableLabel || "Τραπέζι"}: ${order.table.tableName}`
      );
    }
    if (info.showServer && order.user?.displayName) {
      this.printer.println(
        `${info.serverLabel || "Σερβιτόρος"}: ${order.user.displayName}`
      );
    }

    this.printer.drawLine();
  }

  private printTotals(final: number): void {
    this.printer.drawLine();
    this.printer.bold(true);
    const totalLabel = this.template.totals?.totalLabel || "ΣΥΝΟΛΟ";
    this.printItemLine(`${totalLabel}:`, `${final.toFixed(2)}${this.currency}`);
    this.printer.bold(false);
  }

  private printFooter(): void {
    this.printer.drawLine();
    this.printer.alignCenter();

    if (this.template.footer?.lines) {
      this.template.footer.lines.forEach((line) => {
        this.printer.println(line);
      });
    } else {
      this.printer.println("Σας ευχαριστούμε!");
      this.printer.println("Καλή όρεξη!");
    }

    this.printer.cut();
  }

  async printOrder(
    order: OrderIO,
    orderItems: OrderItemIO[]
  ): Promise<boolean> {
    try {
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error("Printer not connected");
      }

      this.currency = order.user?.restaurant?.currencySymbol
        ? order.user?.restaurant?.currencySymbol
        : "€";

      this.printHeader(order.user?.restaurant);
      this.printOrderInfo(order);
      this.printItems(orderItems, order.couvert);
      this.printTotals(order.finalCost);
      this.printFooter();

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
