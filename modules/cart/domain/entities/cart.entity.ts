export interface CartProps {
  userId?: string;
  sessionId?: string;
  items: Map<string, CartItem>;
  createdAt: Date;
  updatedAt: Date;
}

import { CartItem } from './cart-item.entity';

export class Cart {
  private constructor(private props: CartProps) {}

  static createForUser(userId: string): Cart {
    return new Cart({
      userId,
      items: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static createForSession(sessionId: string): Cart {
    return new Cart({
      sessionId,
      items: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: CartProps): Cart {
    return new Cart(props);
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  get items(): CartItem[] {
    return Array.from(this.props.items.values());
  }

  get itemCount(): number {
    return this.props.items.size;
  }

  get totalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice(): number {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  addItem(item: CartItem): void {
    const uniqueKey = item.getUniqueKey();
    const existing = this.props.items.get(uniqueKey);
    if (existing) {
      existing.increment(item.quantity);
    } else {
      this.props.items.set(uniqueKey, item);
    }
    this.props.updatedAt = new Date();
  }

  removeItem(uniqueKey: string): void {
    this.props.items.delete(uniqueKey);
    this.props.updatedAt = new Date();
  }

  updateItemQuantity(uniqueKey: string, quantity: number): void {
    const item = this.props.items.get(uniqueKey);
    if (item) {
      if (quantity <= 0) {
        this.props.items.delete(uniqueKey);
      } else {
        item.updateQuantity(quantity);
      }
      this.props.updatedAt = new Date();
    }
  }

  clear(): void {
    this.props.items.clear();
    this.props.updatedAt = new Date();
  }

  hasItem(productId: string): boolean {
    return this.props.items.has(productId);
  }

  isEmpty(): boolean {
    return this.props.items.size === 0;
  }

  toJSON(): Omit<CartProps, 'items'> & { items: ReturnType<CartItem['toJSON']>[] } & { totalQuantity: number; totalPrice: number } {
    return {
      userId: this.props.userId,
      sessionId: this.props.sessionId,
      items: this.items.map((item) => item.toJSON()),
      totalQuantity: this.totalQuantity,
      totalPrice: this.totalPrice,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
