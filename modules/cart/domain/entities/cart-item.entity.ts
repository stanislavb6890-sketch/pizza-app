export interface CartItemProps {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string;
  extras?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export class CartItem {
  private constructor(private props: CartItemProps) {}

  static create(props: CartItemProps): CartItem {
    if (props.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    return new CartItem(props);
  }

  get productId(): string {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get productPrice(): number {
    return this.props.productPrice;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get extras(): Array<{ id: string; name: string; price: number }> {
    return this.props.extras || [];
  }

  get extrasPrice(): number {
    return (this.props.extras || []).reduce((sum, extra) => sum + extra.price, 0);
  }

  get totalPrice(): number {
    return (this.productPrice + this.extrasPrice) * this.props.quantity;
  }

  updateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    this.props.quantity = quantity;
  }

  increment(amount: number = 1): void {
    this.props.quantity += amount;
  }

  decrement(amount: number = 1): void {
    if (this.props.quantity - amount < 1) {
      throw new Error('Quantity cannot be less than 1');
    }
    this.props.quantity -= amount;
  }

  getUniqueKey(): string {
    const extrasStr = (this.props.extras || [])
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(e => e.id)
      .join(',');
    return `${this.props.productId}:${extrasStr}`;
  }

  toJSON(): CartItemProps & { totalPrice: number; extrasPrice: number } {
    return { 
      ...this.props, 
      totalPrice: this.totalPrice,
      extrasPrice: this.extrasPrice 
    };
  }
}
