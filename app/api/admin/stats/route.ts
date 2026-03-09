import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalUsers,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
