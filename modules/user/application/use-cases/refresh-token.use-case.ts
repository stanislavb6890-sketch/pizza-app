import { prisma } from '@/db/prisma';
import { authService, type TokenPayload } from '@/core/auth';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefreshTokenUseCase {
  async execute(refreshToken: string): Promise<RefreshTokenResult> {
    // Verify refresh token
    const payload = await authService.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw ApiError.unauthorized('TOKEN_REVOKED', 'Refresh token has been revoked');
    }

    if (storedToken.revokedAt) {
      throw ApiError.unauthorized('TOKEN_REVOKED', 'Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('TOKEN_EXPIRED', 'Refresh token has expired');
    }

    // Generate new token pair
    const tokenPayload: TokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    const tokens = await authService.generateTokenPair(tokenPayload);

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    });

    logger.info('Token refreshed', { userId: payload.userId });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

export const refreshTokenUseCase = new RefreshTokenUseCase();
