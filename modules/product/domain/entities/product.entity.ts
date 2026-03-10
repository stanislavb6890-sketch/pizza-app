export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  composition?: string;
  imageUrl?: string;
  price: number;
  discountPrice?: number;
  weight?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  subCategoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private props: ProductProps) {}

  static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>): Product {
    return new Product({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get composition(): string | undefined {
    return this.props.composition;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get price(): number {
    return this.props.price;
  }

  get discountPrice(): number | undefined {
    return this.props.discountPrice;
  }

  get effectivePrice(): number {
    return this.props.discountPrice ?? this.props.price;
  }

  get weight(): number | undefined {
    return this.props.weight;
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get subCategoryId(): string | undefined {
    return this.props.subCategoryId;
  }

  updateAvailability(available: boolean): void {
    this.props.isAvailable = available;
    this.props.updatedAt = new Date();
  }

  updatePrice(price: number, discountPrice?: number): void {
    this.props.price = price;
    this.props.discountPrice = discountPrice;
    this.props.updatedAt = new Date();
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}
