import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      throw ApiError.unauthorized('AUTH_REQUIRED', 'Authentication required');
    }

    let payload;
    try {
      payload = authService.verifyAccessTokenSync(accessToken);
    } catch {
      throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid or expired token');
    }

    const existing = await prisma.address.findFirst({
      where: { id: params.id, userId: payload.userId, deletedAt: null },
    });

    if (!existing) {
      throw ApiError.notFound('ADDRESS_NOT_FOUND', 'Address not found');
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: payload.userId, deletedAt: null },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: params.id },
        data: { isDefault: true },
      }),
    ]);

    const addresses = await prisma.address.findMany({
      where: { userId: payload.userId, deletedAt: null },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to set default address:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to set default address' },
      { status: 500 },
    );
  }
}