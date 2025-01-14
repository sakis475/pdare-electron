import { printOrder } from "../printers/print";
import {
  ORDER_RECEIVED,
  EventEmitter,
  HEALTH_CHECK_RECEIVE,
} from "./EventEmitter";
import { EventId, socketManager } from "./SocketManager";

class SocketEventSubscriber {
  // Method to initialize and subscribe to all socket events
  public async initialize() {
    socketManager.on(
      EventId.printOrder,
      SocketEventSubscriber.handleOrderReceived
    );
    socketManager.on(EventId.healthCheck, SocketEventSubscriber.healthCheck);
  }

  static async handleOrderReceived(order: OrderIO): Promise<void> {
    console.log("Socket Event: handleOrderReceived");
    EventEmitter.emit(ORDER_RECEIVED, printOrder(order));
  }

  static async healthCheck(): Promise<void> {
    EventEmitter.emit(HEALTH_CHECK_RECEIVE, []);
  }
}

export const socketEventSubscriber = new SocketEventSubscriber();

export default SocketEventSubscriber;
