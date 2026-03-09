import type { Product } from '../entities/product.entity';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySubCategoryId(subCategoryId: string): Promise<Product[]>;
  findAvailable(): Promise<Product[]>;
  findFeatured(): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}
