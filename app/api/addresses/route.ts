import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    console.error('Failed to fetch addresses:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch addresses' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { street, building, apartment, entrance, floor, comment } = body;

    if (!street || !building) {
      throw ApiError.badRequest('VALIDATION_ERROR', 'Street and building are required');
    }

    const existingAddresses = await prisma.address.count({
      where: { userId: payload.userId, deletedAt: null },
    });

    const isDefault = existingAddresses === 0;

    const address = await prisma.address.create({
      data: {
        userId: payload.userId,
        street,
        building,
        apartment: apartment || null,
        entrance: entrance || null,
        floor: floor || null,
        comment: comment || null,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to create address:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create address' },
      { status: 500 },
    );
  }
}