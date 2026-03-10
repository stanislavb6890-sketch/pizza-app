import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { authService, type TokenPayload } from '@/core/auth';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = adminLoginSchema.parse(body);
    const { email, password } = validatedData;

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!admin.isActive) {
      throw ApiError.forbidden('ADMIN_INACTIVE', 'Admin account is inactive');
    }

    const isValidPassword = await authService.comparePassword(password, admin.passwordHash);

    if (!isValidPassword) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const tokens = await authService.generateTokenPair(tokenPayload);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info('Admin logged in', { adminId: admin.id, email: admin.email, role: admin.role });

    const response = NextResponse.json({
      success: true,
      data: {
        userId: admin.id,
        email: admin.email,
        role: admin.role,
        expiresIn: tokens.expiresIn,
      },
    });

    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 900,
      path: '/',
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expiresIn,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.errors[0].message },
        { status: 400 },
      );
    }

    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to login' },
      { status: 500 },
    );
  }
}
