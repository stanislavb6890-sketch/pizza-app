import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      pendingOrders,
      todayOrders,
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
    ]);

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingOrders,
      todayOrders,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
