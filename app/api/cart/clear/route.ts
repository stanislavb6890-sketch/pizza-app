import { NextRequest, NextResponse } from 'next/server';
import { clearCartUseCase } from '@/modules/cart/application';
import { ApiError } from '@/core/errors';

/**
 * POST /api/cart/clear
 * Clear entire cart
 */
export async function POST(request: NextRequest) {
  try {
    // Get session ID
    let sessionId = request.cookies.get('sessionId')?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Get user ID
    const userId = request.cookies.get('userId')?.value;

    await clearCartUseCase.execute(userId, sessionId);

    return NextResponse.json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to clear cart' },
      { status: 500 },
    );
  }
}
