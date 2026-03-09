import { prisma } from '@/db/prisma';
import { Order, OrderStatus } from '@modules/order/domain';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';

export class CancelOrderUseCase {
  async execute(orderId: string, userId: string): Promise<Order> {
    const orderPrisma = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        orderItems: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!orderPrisma) {
      throw ApiError.notFound('ORDER_NOT_FOUND', 'Order not found');
    }

    // Check ownership
    if (orderPrisma.userId !== userId) {
      throw ApiError.forbidden('ORDER_ACCESS_DENIED', 'You can only cancel your own orders');
    }

    // Check if order can be cancelled
    const order = Order.fromPersistence({
      id: orderPrisma.id,
      userId: orderPrisma.userId,
      items: orderPrisma.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: '',
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

    if (!order.canCancel()) {
      throw ApiError.badRequest(
        'ORDER_CANNOT_BE_CANCELLED',
        'Order cannot be cancelled in current status'
      );
    }

    // Cancel order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        orderItems: true,
      },
    });

    // Cancel pending payment if exists
    const pendingPayment = orderPrisma.payments.find(
      (p) => p.status === 'PENDING' || p.status === 'PROCESSING'
    );

    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    logger.info('Order cancelled', {
      orderId,
      userId,
      reason: 'User requested',
    });

    return Order.fromPersistence({
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      items: updatedOrder.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: '',
        quantity: item.quantity,
        price: Number(item.price),
      })),
      status: updatedOrder.status as unknown as OrderStatus,
      totalPrice: Number(updatedOrder.totalPrice),
      deliveryPrice: Number(updatedOrder.deliveryPrice),
      addressId: updatedOrder.addressId,
      notes: updatedOrder.notes ?? undefined,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    });
  }
}

export const cancelOrderUseCase = new CancelOrderUseCase();
