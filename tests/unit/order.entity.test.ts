import { describe, it, expect } from 'vitest';
import { Order, OrderStatus } from '@/modules/order/domain';

describe('Order Entity', () => {
  it('should create an order with correct properties', () => {
    const order = Order.create({
      userId: 'user-1',
      items: [
        { id: 'item-1', productId: 'product-1', productName: 'Pizza', quantity: 2, price: 500 },
      ],
      status: OrderStatus.PENDING,
      totalPrice: 1000,
      deliveryPrice: 200,
      addressId: 'address-1',
    });

    expect(order.id).toBeDefined();
    expect(order.userId).toBe('user-1');
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.items).toHaveLength(1);
    expect(order.canCancel()).toBe(true);
  });

  it('should calculate total correctly', () => {
    const order = Order.create({
      userId: 'user-1',
      items: [
        { id: 'item-1', productId: 'product-1', productName: 'Pizza', quantity: 2, price: 500 },
        { id: 'item-2', productId: 'product-2', productName: 'Cola', quantity: 3, price: 100 },
      ],
      status: OrderStatus.PENDING,
      totalPrice: 0,
      deliveryPrice: 200,
      addressId: 'address-1',
    });

    expect(order.calculateTotal()).toBe(1500);
  });

  it('should not allow cancellation after preparing', () => {
    const order = Order.create({
      userId: 'user-1',
      items: [],
      status: OrderStatus.PREPARING,
      totalPrice: 0,
      deliveryPrice: 0,
      addressId: 'address-1',
    });

    expect(order.canCancel()).toBe(false);
    expect(() => order.cancel()).toThrow('Order cannot be cancelled');
  });
});
