// src/Sockets/EventEmitter.ts

interface Subscription {
  remove: () => void;
  listener: (...args: any[]) => any;
}

class SafeEventEmitter {
  private activeListeners: Map<string, Set<Subscription>> = new Map();
  private maxListeners: number = 10;

  constructor() {
    // Initialize empty event emitter
  }

  on(eventType: string, listener: (...args: any[]) => any): this {
    this.trackListener(eventType, listener);
    return this;
  }

  addListener(eventType: string, listener: (...args: any[]) => any): this {
    return this.on(eventType, listener);
  }

  private trackListener(
    eventType: string,
    listener: (...args: any[]) => any
  ): void {
    if (!this.activeListeners.has(eventType)) {
      this.activeListeners.set(eventType, new Set());
    }

    const subscription: Subscription = {
      listener,
      remove: () => {
        this.removeListener(eventType, listener);
        const listeners = this.activeListeners.get(eventType);
        if (listeners) {
          listeners.delete(subscription);
        }
      },
    };

    const listeners = this.activeListeners.get(eventType)!;
    listeners.add(subscription);

    // Warn if exceeding max listeners
    if (listeners.size > this.maxListeners) {
      console.warn(
        `Possible memory leak detected. ${listeners.size} ${eventType} listeners added. Use emitter.setMaxListeners() to increase limit`
      );
    }
  }

  emit(eventType: string, ...args: any[]): boolean {
    const listeners = this.activeListeners.get(eventType);
    if (!listeners) return false;

    listeners.forEach((subscription) => {
      try {
        subscription.listener(...args);
      } catch (error) {
        console.error(`Error in ${eventType} event handler:`, error);
      }
    });

    return true;
  }

  subscribe(
    eventType: string,
    listener: (...args: any[]) => any
  ): Subscription {
    this.on(eventType, listener);
    const listeners = this.activeListeners.get(eventType);
    const subscription = Array.from(listeners || []).find(
      (sub) => sub.listener === listener
    );
    if (!subscription) {
      throw new Error(`Failed to create subscription for ${eventType}`);
    }
    return subscription;
  }

  removeListener(eventType: string, listener: (...args: any[]) => any): this {
    const listeners = this.activeListeners.get(eventType);
    if (listeners) {
      const subscription = Array.from(listeners).find(
        (sub) => sub.listener === listener
      );
      if (subscription) {
        listeners.delete(subscription);
      }
    }
    return this;
  }

  removeAllListeners(eventType?: string): this {
    if (eventType) {
      this.removeAllListenersForEvent(eventType);
    } else {
      this.activeListeners.forEach((_, type) => {
        this.removeAllListenersForEvent(type);
      });
      this.activeListeners.clear();
    }
    return this;
  }

  private removeAllListenersForEvent(eventType: string): void {
    const listeners = this.activeListeners.get(eventType);
    if (listeners) {
      listeners.clear();
      this.activeListeners.delete(eventType);
    }
  }

  hasListeners(eventType: string): boolean {
    const listeners = this.activeListeners.get(eventType);
    return listeners ? listeners.size > 0 : false;
  }

  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }

  listenerCount(eventType: string): number {
    return this.activeListeners.get(eventType)?.size || 0;
  }

  once(eventType: string, listener: (...args: any[]) => any): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(eventType, wrapper);
      listener.apply(this, args);
    };
    this.on(eventType, wrapper);
    return this;
  }
}

// Create a single instance of the event emitter
export const EventEmitter = new SafeEventEmitter();

// Event constants
export const ORDER_RECEIVED = "ORDER_RECEIVED";
export const HEALTH_CHECK_RECEIVE = "HEALTH_CHECK_RECEIVE";

// Type for event names
export type EventType = typeof ORDER_RECEIVED | typeof HEALTH_CHECK_RECEIVE;
