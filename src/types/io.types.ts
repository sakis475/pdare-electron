type TableItemPropertyIO = {
  id: number;
  itemProperty: ItemProperty;
};

type OrderItemIO = {
  id: number;
  quantity: number;
  comment: string;
  item: ItemReq;
  itemPropertyOfItem: TableItemPropertyIO[];
};

type OrderIO = {
  id: number;
  uniqueId?: string;
  table: Table;
  couvert: number;
  comment: string;
  createdAt: string;
  closedAt: string | null;
  orderReady: boolean;
  user: User;
  finalCost: number;
  orderPrinters: OrderPrinters[];
  printType: PrintType;
};

type TableIO = {
  id: number;
  tableName: string;
  isEnabled: boolean;
  tableOrder: number;
  occupiedByOrder: OrderIO;
};

type OrderPrinters = {
  mac: string;
  printLocation: PrintLocation;
  overrideIP?: string;
  overridePort?: string;
  characterSet?: any;
  orderItems: OrderItemIO[];
};

enum PrintType {
  PERSONEL = "personel",
  FINAL = "final",
}
