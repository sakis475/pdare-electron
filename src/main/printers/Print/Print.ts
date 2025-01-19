import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";

interface PrinterConfig {
  printerIP: string;
  printerPort?: string;
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
  couvert: number;
}

class OrderPrinterAdapter {
  private config: Required<PrinterConfig>;
  private printer: ThermalPrinter;

  constructor(config: PrinterConfig) {
    this.config = {
      printerIP: config.printerIP!,
      printerPort: config.printerPort || "9100",
      printerType: config.printerType || PrinterTypes.EPSON,
      characterSet: config.characterSet || CharacterSet.PC737_GREEK,
      timeout: config.timeout || 5000,
    };

    this.printer = new ThermalPrinter({
      type: this.config.printerType,
      interface: `tcp://${this.config.printerIP}:${this.config.printerPort}`,
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

  private calculateTotals(
    orderItems: OrderItemIO[],
    couvert: number
  ): OrderTotals {
    const subtotal =
      orderItems.reduce(
        (sum, item) => sum + item.item.cost * item.quantity,
        0
      ) + couvert;
    const tax = subtotal * 0.24; // 24% VAT
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      couvert,
    };
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

      // Print Header
      this.printHeader(order.user?.restaurant);

      // Print Order Info
      this.printOrderInfo(order);

      // Print Items
      this.printItems(orderItems);

      // Print Totals
      const totals = this.calculateTotals(orderItems, order.couvert);
      this.printTotals(totals);

      // Print Footer
      this.printFooter();
      console.log("print execute");
      // Execute print job
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

    // Order number and date
    if (order.uniqueId) {
      this.printer.println(`Αριθμός Παραγγελίας: #${order.uniqueId}`);
    }
    if (order.createdAt) {
      this.printer.println(`Ημερομηνία: ${this.formatDate(order.createdAt)}`);
      this.printer.println(`Ώρα: ${this.formatTime(order.createdAt)}`);
    }

    // Table info
    this.printer.println(`Τραπέζι: ${order.table.tableName}`);
    if (order.user?.displayName) {
      this.printer.println(`Σερβιτόρος: ${order.user.displayName}`);
    }

    this.printer.drawLine();
  }

  private printItems(orderItems: OrderItemIO[]): void {
    this.printer.bold(true);
    this.printer.println("ΠΑΡΑΓΓΕΛΙΑ");
    this.printer.bold(false);
    this.printer.newLine();

    orderItems.forEach((item) => {
      const total = item.item.cost * item.quantity;
      const leftText = `${item.quantity}x ${item.item.title}`;
      const rightText = `${total.toFixed(2)}€`;
      this.printer.leftRight(leftText, rightText);

      // Print item properties if any
      if (item.itemPropertyOfItem.length > 0) {
        item.itemPropertyOfItem.forEach((prop) => {
          this.printer.println(
            `  - ${prop.itemProperty.propertyName}: ${prop.itemProperty.propertyValue}`
          );
        });
      }

      // Print item comment if any
      if (item.comment) {
        this.printer.println(`  * ${item.comment}`);
      }
    });
  }

  private printTotals(totals: OrderTotals): void {
    this.printer.drawLine();

    if (totals.couvert > 0) {
      this.printer.leftRight("Κουβέρ:", `${totals.couvert.toFixed(2)}€`);
    }

    this.printer.leftRight("Υποσύνολο:", `${totals.subtotal.toFixed(2)}€`);
    this.printer.leftRight("ΦΠΑ 24%:", `${totals.tax.toFixed(2)}€`);
    this.printer.bold(true);
    this.printer.leftRight("ΣΥΝΟΛΟ:", `${totals.total.toFixed(2)}€`);
    this.printer.bold(false);
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
