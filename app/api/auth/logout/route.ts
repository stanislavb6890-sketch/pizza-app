import { NextRequest, NextResponse } from 'next/server';
import { logoutUseCase } from '@/modules/user/application';
import { ApiError } from '@/core/errors';
import { authService } from '@/core/auth';

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      throw ApiError.unauthorized('MISSING_TOKEN', 'Refresh token is required');
    }

    // Verify token to get user ID
    const payload = await authService.verifyRefreshToken(refreshToken);

    // Logout
    await logoutUseCase.execute(payload.userId, refreshToken);

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear cookies
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
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

    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to logout' },
      { status: 500 },
    );
  }
}
