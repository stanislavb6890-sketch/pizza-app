import { prisma } from '@/db/prisma';
import { Order, OrderStatus } from '@modules/order/domain';
import { ApiError } from '@/core/errors';

export class GetOrderByIdUseCase {
  async execute(orderId: string, userId?: string): Promise<Order> {
    const orderPrisma = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
        payments: true,
      },
    });

    if (!orderPrisma) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }

    // Check ownership if userId provided
    if (userId && orderPrisma.userId !== userId) {
      throw ApiError.forbidden('ORDER_ACCESS_DENIED', 'You can only view your own orders');
    }

    return Order.fromPersistence({
      id: orderPrisma.id,
      userId: orderPrisma.userId,
      items: orderPrisma.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
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
  }
}

export const getOrderByIdUseCase = new GetOrderByIdUseCase();
