import { NextRequest, NextResponse } from 'next/server';
import { addToCartUseCase, addToCartSchema } from '@/modules/cart/application';
import { ApiError } from '@/core/errors';

/**
 * POST /api/cart/items
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addToCartSchema.parse(body);

    // Get session ID from cookie or generate one
    let sessionId = request.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Get user ID from auth context (if logged in)
    const userId = request.cookies.get('userId')?.value;

    const cart = await addToCartUseCase.execute(userId, sessionId, validatedData);

    const response = NextResponse.json({
      success: true,
      data: cart.toJSON(),
    });

    // Set session cookie if not exists
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add item to cart' },
      { status: 500 },
    );
  }
}
