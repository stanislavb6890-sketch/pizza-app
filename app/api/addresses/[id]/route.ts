import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export async function PUT(
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

    const body = await request.json();
    const { street, building, apartment, entrance, floor, comment } = body;

    const address = await prisma.address.update({
      where: { id: params.id },
      data: {
        street: street || existing.street,
        building: building || existing.building,
        apartment: apartment !== undefined ? apartment : existing.apartment,
        entrance: entrance !== undefined ? entrance : existing.entrance,
        floor: floor !== undefined ? floor : existing.floor,
        comment: comment !== undefined ? comment : existing.comment,
      },
    });

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to update address:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update address' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    await prisma.address.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to delete address:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete address' },
      { status: 500 },
    );
  }
}