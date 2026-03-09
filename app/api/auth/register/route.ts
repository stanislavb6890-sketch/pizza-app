import { NextRequest, NextResponse } from 'next/server';
import { registerUseCase, registerSchema } from '@/modules/user/application';
import { ApiError } from '@/core/errors';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const result = await registerUseCase.execute(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to register user' },
      { status: 500 },
    );
  }
}
