export interface CartItemProps {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string;
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

  get totalPrice(): number {
    return this.props.productPrice * this.props.quantity;
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

  toJSON(): CartItemProps & { totalPrice: number } {
    return { ...this.props, totalPrice: this.totalPrice };
  }
}
