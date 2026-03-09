export interface DeliveryZoneProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  minOrderSum?: number;
  estimatedTime?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliveryZone {
  private constructor(private props: DeliveryZoneProps) {}

  static create(props: Omit<DeliveryZoneProps, 'id' | 'createdAt' | 'updatedAt'>): DeliveryZone {
    return new DeliveryZone({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: DeliveryZoneProps): DeliveryZone {
    return new DeliveryZone(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get minOrderSum(): number | undefined {
    return this.props.minOrderSum;
  }

  get estimatedTime(): number | undefined {
    return this.props.estimatedTime;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  isAvailableForOrderSum(orderSum: number): boolean {
    if (!this.props.minOrderSum) return true;
    return orderSum >= this.props.minOrderSum;
  }

  calculateDeliveryPrice(orderSum: number): number {
    if (this.isAvailableForOrderSum(orderSum)) {
      return this.props.price;
    }
    throw new Error(`Minimum order sum is ${this.props.minOrderSum}`);
  }

  toJSON(): DeliveryZoneProps {
    return { ...this.props };
  }
}
