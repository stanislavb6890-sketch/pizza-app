import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error checking auth:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to check auth' },
      { status: 500 },
    );
  }
}
