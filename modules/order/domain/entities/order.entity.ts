export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderProps {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  deliveryPrice: number;
  addressId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private constructor(private props: OrderProps) {}

  static create(props: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt'>): Order {
    return new Order({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get items(): OrderItem[] {
    return this.props.items;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get totalPrice(): number {
    return this.props.totalPrice;
  }

  get deliveryPrice(): number {
    return this.props.deliveryPrice;
  }

  get addressId(): string {
    return this.props.addressId;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  canCancel(): boolean {
    return this.props.status === OrderStatus.PENDING || this.props.status === OrderStatus.CONFIRMED;
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new Error('Order cannot be cancelled in current status');
    }
    this.props.status = OrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  updateStatus(newStatus: OrderStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  calculateTotal(): number {
    const itemsTotal = this.props.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return itemsTotal + this.props.deliveryPrice;
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }
}
