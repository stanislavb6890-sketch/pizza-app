import { NextRequest, NextResponse } from 'next/server';
import { createOrderUseCase, createOrderSchema } from '@/modules/order/application';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';
import { prisma } from '@/db/prisma';

/**
 * GET /api/orders
 * Get user's order history
 */
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

    const orders = await prisma.order.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        deliveryPrice: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch orders' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * Create a new order from cart
 */
export async function POST(request: NextRequest) {
  try {
    // Get and verify user from access token
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
    const validatedData = createOrderSchema.parse(body);

    // Get session ID for cart
    const sessionId = request.cookies.get('sessionId')?.value || crypto.randomUUID();

    const result = await createOrderUseCase.execute(
      payload.userId,
      sessionId,
      validatedData
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: result.order.id,
          status: result.order.status,
          total: result.order.totalPrice + result.order.deliveryPrice,
          paymentId: result.paymentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create order' },
      { status: 500 },
    );
  }
}
