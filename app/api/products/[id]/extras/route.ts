import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const extras = await prisma.productExtra.findMany({
      where: {
        productId: params.id,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: extras,
    });
  } catch (error) {
    console.error('Failed to fetch extras:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch extras' },
      { status: 500 }
    );
  }
}
