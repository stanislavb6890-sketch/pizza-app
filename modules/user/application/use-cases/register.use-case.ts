import { prisma } from '@/db/prisma';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';
import { logger } from '@/core/logger';
import type { RegisterInput } from '../schemas';

export interface RegisterResult {
  userId: string;
  email: string;
}

export class RegisterUseCase {
  async execute(input: RegisterInput): Promise<RegisterResult> {
    const { email, password, firstName, lastName, phone } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('USER_EXISTS', 'User with this email already exists');
    }

    // Check phone uniqueness if provided
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw ApiError.conflict('PHONE_EXISTS', 'User with this phone already exists');
      }
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      userId: user.id,
      email: user.email,
    };
  }
}

export const registerUseCase = new RegisterUseCase();
