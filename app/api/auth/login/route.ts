import { NextRequest, NextResponse } from 'next/server';
import { loginUseCase, loginSchema } from '@/modules/user/application';
import { ApiError } from '@/core/errors';

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const result = await loginUseCase.execute(validatedData);

    const response = NextResponse.json({
      success: true,
      data: {
        userId: result.userId,
        email: result.email,
        role: result.role,
        expiresIn: result.expiresIn,
      },
    });

    // Set HTTP-only cookies
    response.cookies.set('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 900,
      path: '/',
    });

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to login' },
      { status: 500 },
    );
  }
}
