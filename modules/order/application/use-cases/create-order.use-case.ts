import { prisma } from '@/db/prisma';
import { Order, OrderStatus } from '@modules/order/domain';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';
import type { CreateOrderInput } from '../schemas';

export interface CreateOrderResult {
  order: Order;
  paymentId?: string;
}

export class CreateOrderUseCase {
  async execute(
    userId: string,
    sessionId: string,
    input: CreateOrderInput
  ): Promise<CreateOrderResult> {
    // Get cart from Redis
    const cartKey = userId ? `cart:user:${userId}` : `cart:session:${sessionId}`;
    const cartData = await this.getCartFromRedis(cartKey);

    if (!cartData || cartData.items.length === 0) {
      throw ApiError.badRequest('CART_EMPTY', 'Cart is empty');
    }

    // Validate products availability and prices
    const validatedItems = await this.validateProducts(cartData.items);

    // Calculate totals
    const itemsTotal = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Get delivery zone and price
    const deliveryZone = input.deliveryZoneId
      ? await prisma.deliveryZone.findUnique({
          where: { id: input.deliveryZoneId, isActive: true },
        })
      : null;

    const deliveryPrice = deliveryZone ? Number(deliveryZone.price) : 0;
    const totalPrice = itemsTotal + deliveryPrice;

    // Create or use existing address
    let addressId = input.addressId;
    if (!addressId && input.newAddress) {
      const address = await prisma.address.create({
        data: {
          userId,
          ...input.newAddress,
          isDefault: false,
        },
      });
      addressId = address.id;
    }

    if (!addressId) {
      throw ApiError.badRequest('ADDRESS_REQUIRED', 'Address is required');
    }

    // Create order in database (transaction)
    const orderPrisma = await prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        totalPrice,
        deliveryPrice,
        deliveryZoneId: input.deliveryZoneId,
        addressId,
        notes: input.notes,
        orderItems: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Clear cart
    await this.clearCart(cartKey);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: orderPrisma.id,
        userId,
        provider: input.paymentMethod === 'card' ? 'STRIPE' : 'CASH',
        status: 'PENDING',
        amount: totalPrice,
        currency: 'RUB',
        idempotencyKey: crypto.randomUUID(),
      },
    });

    logger.info('Order created', {
      orderId: orderPrisma.id,
      userId,
      total: totalPrice,
      itemsCount: validatedItems.length,
    });

    const order = Order.fromPersistence({
      id: orderPrisma.id,
      userId: orderPrisma.userId,
      items: orderPrisma.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: validatedItems.find((i) => i.productId === item.productId)?.productName || '',
        quantity: item.quantity,
        price: Number(item.price),
      })),
      status: orderPrisma.status as unknown as OrderStatus,
      totalPrice: Number(orderPrisma.totalPrice),
      deliveryPrice: Number(orderPrisma.deliveryPrice),
      addressId: orderPrisma.addressId,
      notes: orderPrisma.notes ?? undefined,
      createdAt: orderPrisma.createdAt,
      updatedAt: orderPrisma.updatedAt,
    });

    return {
      order,
      paymentId: payment.id,
    };
  }

  private async getCartFromRedis(key: string): Promise<{
    items: Array<{
      productId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      imageUrl?: string | null;
    }>;
    totalQuantity: number;
    totalPrice: number;
  } | null> {
    const redis = await this.getRedisClient();
    const data = await redis.get(key);
    if (!data) return null;
    return data as unknown as {
      items: Array<{
        productId: string;
        productName: string;
        productPrice: number;
        quantity: number;
        imageUrl?: string | null;
      }>;
      totalQuantity: number;
      totalPrice: number;
    };
  }

  private async getRedisClient() {
    const { getRedisClient } = await import('@/infra/redis');
    return getRedisClient();
  }

  private async clearCart(key: string): Promise<void> {
    const redis = await this.getRedisClient();
    await redis.del(key);
  }

  private async validateProducts(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      price: number;
      quantity: number;
    }>
  > {
    const productIds = items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null,
      },
    });

    if (products.length !== items.length) {
      throw ApiError.badRequest(
        'PRODUCTS_NOT_FOUND',
        'Some products are not available'
      );
    }

    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (!product.isAvailable) {
        throw ApiError.badRequest(
          'PRODUCT_UNAVAILABLE',
          `Product "${product.name}" is not available`
        );
      }

      return {
        productId: item.productId,
        productName: product.name,
        price: product.discountPrice
          ? Number(product.discountPrice)
          : Number(product.price),
        quantity: item.quantity,
      };
    });
  }
}

export const createOrderUseCase = new CreateOrderUseCase();
