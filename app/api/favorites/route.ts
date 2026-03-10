import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    let payload;
    try {
      payload = authService.verifyAccessTokenSync(accessToken);
    } catch {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            imageUrl: true,
            isAvailable: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: favorites.map(f => f.product),
    });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch favorites' },
      { status: 500 }
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      throw ApiError.unauthorized('USER_NOT_FOUND', 'User not found');
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      throw ApiError.badRequest('PRODUCT_REQUIRED', 'Product ID is required');
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: payload.userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        success: true,
        data: { favorited: false },
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: payload.userId,
        productId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { favorited: true, id: favorite.id },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to toggle favorite:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
