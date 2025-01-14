interface ItemProperty {
  id?: number;
  propertyName: string;
  propertyValue: string;
  propertyType: 'multiselect' | 'singleselect';
  isEnabled?: boolean;
  orderGroup: number | null;
  orderItem: number | null;
  selected: boolean;
  required?: boolean;
  dependsOn?: number | null;
  oItemPropertyId?: number;
  isEdited?: boolean;
  originalPropertyValue?: string;
  isDeleted?: boolean;
  isDeletedGroup?: boolean;
}

// example [Milk: [], Sugar: []]
interface ItemPropertiesGrouped {
  [key: string]: ItemProperty[];
}

interface Category {
  id?: number;
  title: string;
  orderCategory?: number;
  isEnabled?: boolean;
  color?: string;
}

interface PropertyPattern {
  id?: number;
  propertyPatternTitle: string;
  itemProperties: ItemProperty[];
  markAsDelete?: boolean;
  propertyPatternOrder?: number;
  category: Category;
}

interface Restaurant {
  active: boolean;
  id: number;
  restaurantName: string;
  couvertCost: number;
  currencySymbol: string;
}

interface Item {
  categoryCurrentId?: number;
  categoryTitle?: string;
  id: number;
  title: string;
  cost: number;
  orderItem: number;
  isEnabled: boolean;
  category: Category;
  itemPropertiesGrouped: ItemPropertiesGrouped;
}

interface ItemReq {
  id?: number;
  category: Category;
  cost: number;
  description: string;
  isEnabled: boolean;
  itemPropertiesGrouped: ItemPropertiesGrouped | ItemProperty[];
  orderItem: number;
  restaurant?: Restaurant;
  title: string;
  quantity?: number;
  newItemId?: string;
  comment?: string;
  alreadySend?: boolean;
  oItemId?: number;
  markForDelete?: boolean;
  orderItemReady?: boolean;
}
interface catGroupedItems {
  [key: string]: ItemReq[];
}

interface Table {
  id: number;
  tableName: string;
  isEnabled: boolean;
  tableOrder: number;
  occupiedByOrder?: Order;
}

interface Order {
  id?: number;
  uniqueId?: string;
  table: Table;
  orderItems: ItemReq[];
  couvert: number;
  comment?: string;
  createdAt?: string;
  closedAt?: string;
  originalTable?: Table;
  finalCost?: number;
  orderReady?: boolean;
  user?: User;
}

interface SendOrderItem {
  id: number;
  itemProperties: number[];
  quantity: number;
  comment?: string;
}

interface OrderNavigationState {
  screenName: any;
  params: any;
}

interface CreateNewOrderRequest {
  orderId?: number;
  table: number | string;
  comment: string;
  items: NewOrderRequestItem[];
}
interface NewOrderRequestItem {
  id: number;
  oItemId: number;
  delete: boolean;
  itemProperties: { id: number; oItemPropertyId: number }[];
  quantity: number;
  comment: string;
}

interface User {
  id?: number;
  active?: boolean;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role: 'owner' | 'waiter' | 'guest';
  restaurant?: Restaurant;
  invitations?: InvitationRequest[];
  markForDelete?: boolean;
}

interface LastCredentialsStorage {
  email: string;
  password: string;
}

interface InvitationRequest {
  id?: number;
  inviteFrom: User;
  inviteTo: User;
  invitationStatus?: InvitationRequestStatus;
  restaurant: Restaurant;
  createdAt: Date;
}

enum InvitationRequestStatus {
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
  AWAITING = 'awaiting',
}
