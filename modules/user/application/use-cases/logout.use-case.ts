import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { logger } from '@/core/logger';

export class LogoutUseCase {
  async execute(userId: string, refreshToken: string): Promise<void> {
    // Revoke the refresh token
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    logger.info('User logged out', { userId });
  }
}

export const logoutUseCase = new LogoutUseCase();
