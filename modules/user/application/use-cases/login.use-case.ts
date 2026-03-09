import { prisma } from '@/db/prisma';
import { authService, type TokenPayload } from '@/core/auth';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';
import type { LoginInput } from '../schemas';

export interface LoginResult {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class LoginUseCase {
  async execute(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('USER_INACTIVE', 'User account is inactive');
    }

    // Verify password
    const isValidPassword = await authService.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Generate token pair
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: 'user',
    };

    const tokens = await authService.generateTokenPair(tokenPayload);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      userId: user.id,
      email: user.email,
      role: 'user',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

export const loginUseCase = new LoginUseCase();
