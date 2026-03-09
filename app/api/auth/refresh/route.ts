import { NextRequest, NextResponse } from 'next/server';
import { refreshTokenUseCase } from '@/modules/user/application';
import { ApiError } from '@/core/errors';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    let refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      throw ApiError.unauthorized('MISSING_TOKEN', 'Refresh token is required');
    }

    const result = await refreshTokenUseCase.execute(refreshToken);

    const response = NextResponse.json({
      success: true,
      data: {
        expiresIn: result.expiresIn,
      },
    });

    // Set new HTTP-only cookies
    response.cookies.set('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 900, // 15 minutes
      path: '/',
    });

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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

    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to refresh token' },
      { status: 500 },
    );
  }
}
