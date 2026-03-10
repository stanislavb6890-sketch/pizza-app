import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId: params.id,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      throw ApiError.unauthorized('USER_NOT_FOUND', 'User not found');
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      throw ApiError.badRequest('INVALID_RATING', 'Rating must be between 1 and 5');
    }

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: payload.userId,
          productId: params.id,
        },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        userId: payload.userId,
        productId: params.id,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Failed to create review:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create review' },
      { status: 500 }
    );
  }
}
