import { describe, it, expect } from 'vitest';
import { Cart, CartItem } from '@/modules/cart/domain';

describe('Cart Entity', () => {
  it('should create a cart for user', () => {
    const cart = Cart.createForUser('user-1');

    expect(cart.userId).toBe('user-1');
    expect(cart.isEmpty()).toBe(true);
    expect(cart.itemCount).toBe(0);
  });

  it('should add items to cart', () => {
    const cart = Cart.createForUser('user-1');
    const item = CartItem.create({
      productId: 'product-1',
      productName: 'Pizza',
      productPrice: 500,
      quantity: 2,
    });

    cart.addItem(item);

    expect(cart.isEmpty()).toBe(false);
    expect(cart.itemCount).toBe(1);
    expect(cart.totalPrice).toBe(1000);
    expect(cart.totalQuantity).toBe(2);
  });

  it('should increment quantity for existing product', () => {
    const cart = Cart.createForUser('user-1');
    const item1 = CartItem.create({
      productId: 'product-1',
      productName: 'Pizza',
      productPrice: 500,
      quantity: 2,
    });
    const item2 = CartItem.create({
      productId: 'product-1',
      productName: 'Pizza',
      productPrice: 500,
      quantity: 3,
    });

    cart.addItem(item1);
    cart.addItem(item2);

    expect(cart.itemCount).toBe(1);
    expect(cart.totalQuantity).toBe(5);
  });

  it('should remove item from cart', () => {
    const cart = Cart.createForUser('user-1');
    const item = CartItem.create({
      productId: 'product-1',
      productName: 'Pizza',
      productPrice: 500,
      quantity: 2,
    });

    cart.addItem(item);
    cart.removeItem('product-1');

    expect(cart.isEmpty()).toBe(true);
  });

  it('should throw error for quantity less than 1', () => {
    expect(() =>
      CartItem.create({
        productId: 'product-1',
        productName: 'Pizza',
        productPrice: 500,
        quantity: 0,
      }),
    ).toThrow('Quantity must be at least 1');
  });
});
