import { describe, it, expect } from 'vitest';
import { Product } from '@/modules/product/domain';

describe('Product Entity', () => {
  it('should create a product with correct properties', () => {
    const product = Product.create({
      name: 'Margherita',
      slug: 'margherita',
      description: 'Classic pizza',
      price: 500,
      isAvailable: true,
      isFeatured: false,
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Margherita');
    expect(product.effectivePrice).toBe(500);
  });

  it('should return discount price when available', () => {
    const product = Product.create({
      name: 'Margherita',
      slug: 'margherita',
      price: 500,
      discountPrice: 400,
      isAvailable: true,
      isFeatured: false,
    });

    expect(product.effectivePrice).toBe(400);
  });

  it('should update availability', () => {
    const product = Product.create({
      name: 'Margherita',
      slug: 'margherita',
      price: 500,
      isAvailable: true,
      isFeatured: false,
    });

    product.updateAvailability(false);
    expect(product.isAvailable).toBe(false);
  });
});
