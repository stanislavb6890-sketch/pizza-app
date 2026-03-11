import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      pendingOrders,
      todayOrders,
      ordersByStatus,
      ordersByDay,
      topProducts,
      yesterdayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM orders 
        WHERE created_at >= ${weekAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.order.count({
        where: { 
          createdAt: { 
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today 
          } 
        },
      }),
    ]);

    const topProductsWithNames = await Promise.all(
      (topProducts as Array<{ productId: string; _sum: { quantity: number | null } }>).map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
        };
      })
    );

    const ordersByDayFormatted = (ordersByDay as Array<{ date: Date; count: bigint }>).map(item => ({
      date: new Date(item.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
      count: Number(item.count),
    }));

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingOrders,
      todayOrders,
      yesterdayOrders,
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
      ordersByDay: ordersByDayFormatted,
      topProducts: topProductsWithNames,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
