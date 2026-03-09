import { prisma } from '@/db/prisma';
import { Order, OrderStatus } from '@modules/order/domain';
import { ApiError } from '@/core/errors';

export class GetOrdersByUserUseCase {
  async execute(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [ordersPrisma, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      }),
      prisma.order.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
    ]);

    const orders = ordersPrisma.map((order) =>
      Order.fromPersistence({
        id: order.id,
        userId: order.userId,
        items: order.orderItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        status: order.status as unknown as OrderStatus,
        totalPrice: Number(order.totalPrice),
        deliveryPrice: Number(order.deliveryPrice),
        addressId: order.addressId,
        notes: order.notes ?? undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })
    );

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const getOrdersByUserUseCase = new GetOrdersByUserUseCase();
