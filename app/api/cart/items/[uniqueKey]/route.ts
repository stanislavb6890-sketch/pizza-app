import { NextRequest, NextResponse } from 'next/server';
import { updateCartItemUseCase, removeFromCartUseCase } from '@/modules/cart/application';
import { ApiError } from '@/core/errors';

/**
 * PUT /api/cart/items/[uniqueKey]
 * Update item quantity in cart
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { uniqueKey: string } }
) {
  try {
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 99) {
      throw ApiError.validation('Invalid quantity', { quantity });
    }

    // Get session ID
    let sessionId = request.cookies.get('sessionId')?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Get user ID
    const userId = request.cookies.get('userId')?.value;

    const cart = await updateCartItemUseCase.execute(userId, sessionId, params.uniqueKey, { quantity });

    return NextResponse.json({
      success: true,
      data: cart.toJSON(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update cart item' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/cart/items/[uniqueKey]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { uniqueKey: string } }
) {
  try {
    // Get session ID
    let sessionId = request.cookies.get('sessionId')?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Get user ID
    const userId = request.cookies.get('userId')?.value;

    const cart = await removeFromCartUseCase.execute(userId, sessionId, { uniqueKey: params.uniqueKey });

    return NextResponse.json({
      success: true,
      data: cart.toJSON(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to remove item from cart' },
      { status: 500 },
    );
  }
}
