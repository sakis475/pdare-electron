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

interface FormattedOrderItem {
  name: string;
  quantity: number;
  price: number;
  comment?: string;
  properties: {
    name: string;
    value: string;
  }[];
}

interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

class OrderPrinterAdapter {
  private config: Required<PrinterConfig>;
  private printer: ThermalPrinter;
  private currency: string = "€";

  constructor(config: PrinterConfig) {
    this.config = {
      printerIP: config.printerIP,
      printerPort: config.printerPort ? config.printerPort : null,
      printerType: config.printerType || PrinterTypes.EPSON,
      characterSet: config.characterSet || CharacterSet.PC737_GREEK,
      timeout: config.timeout || 5000,
    };

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
    return date.toLocaleDateString("el-GR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private formatOrderItems(orderItems: OrderItemIO[]): FormattedOrderItem[] {
    return orderItems.map((item) => ({
      name: item.item.title,
      quantity: item.quantity,
      price: item.item.cost,
      comment: item.comment,
      properties: item.itemPropertyOfItem.map((prop) => ({
        name: prop.itemProperty.propertyName,
        value: prop.itemProperty.propertyValue,
      })),
    }));
  }

  private printItemLine(text: string, price: string): void {
    // Using leftRight for two-column layout
    this.printer.leftRight(text, price);
  }

  private printItems(orderItems: OrderItemIO[], couvert: number): void {
    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.setTextDoubleWidth();
    this.printer.bold(true);
    this.printer.println("ΑΝΑΛΥΣΗ ΠΑΡΑΓΓΕΛΙΑΣ");
    this.printer.bold(false);
    this.printer.setTextNormal();
    this.printer.alignLeft();
    this.printer.drawLine();

    // Print Couvert first if it exists
    if (couvert > 0) {
      const text = `${couvert}x Κουβέρ`;
      const price = `${couvert.toFixed(2)}${this.currency}`;
      this.printItemLine(text, price);
    }

    // Print regular items
    orderItems.forEach((item) => {
      const total = item.item.cost * item.quantity;
      const text = `${item.quantity}x ${item.item.title}`;
      const price = `${total.toFixed(2)}${this.currency}`;

      // If text is too long, split it into multiple lines
      const maxLength = 32; // Adjust based on your printer's width
      if (text.length > maxLength) {
        const lines =
          text.match(new RegExp(`.{1,${maxLength}}(?:\\s|$)`, "g")) || [];
        lines.forEach((line, index) => {
          if (index === lines.length - 1) {
            // Last line gets the price
            this.printItemLine(line.trim(), price);
          } else {
            // Other lines just print the text
            this.printer.println(line.trim());
          }
        });
      } else {
        this.printItemLine(text, price);
      }

      // Print item properties if any
      if (item.itemPropertyOfItem.length > 0) {
        item.itemPropertyOfItem.forEach((prop) => {
          const propText = `  - ${prop.itemProperty.propertyName}: ${prop.itemProperty.propertyValue}`;
          this.printer.println(propText);
        });
      }

      // Print item comment if any
      if (item.comment) {
        this.printer.println(`  * ${item.comment}`);
      }
    });
  }

  private printTotals(final: number): void {
    this.printer.drawLine();
    this.printer.bold(true);
    this.printItemLine("ΣΥΝΟΛΟ:", `${final.toFixed(2)}${this.currency}`);
    this.printer.bold(false);
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

  private printHeader(restaurant: Restaurant | undefined): void {
    if (!restaurant) return;

    this.printer.alignCenter();

    // Print restaurant name
    this.printer.setTextDoubleHeight();
    this.printer.setTextDoubleWidth();
    this.printer.bold(true);
    this.printer.println(restaurant.restaurantName);
    this.printer.bold(false);
    this.printer.setTextNormal();
    this.printer.drawLine();
  }

  private printOrderInfo(order: OrderIO): void {
    this.printer.alignLeft();

    if (order.uniqueId) {
      this.printer.println(`Αριθμός Παραγγελίας: #${order.uniqueId}`);
    }
    if (order.createdAt) {
      this.printer.println(`Ημερομηνία: ${this.formatDate(order.createdAt)}`);
      this.printer.println(`Ώρα: ${this.formatTime(order.createdAt)}`);
    }

    this.printer.println(`Τραπέζι: ${order.table.tableName}`);
    if (order.user?.displayName) {
      this.printer.println(`Σερβιτόρος: ${order.user.displayName}`);
    }

    this.printer.drawLine();
  }

  private printFooter(): void {
    this.printer.drawLine();
    this.printer.alignCenter();
    this.printer.println("Σας ευχαριστούμε!");
    this.printer.println("Καλή όρεξη!");
    this.printer.cut();
  }
}

export default OrderPrinterAdapter;
