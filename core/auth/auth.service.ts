import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AuthService,
  TokenPayload,
  TokenPair,
} from './auth.service.interface';
import { ApiError } from '@/core/errors';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

export class JwtAuthService implements AuthService {
  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { type: 'access' };
      
      if (decoded.type !== 'access') {
        throw ApiError.unauthorized('INVALID_TOKEN_TYPE', 'Token is not an access token');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('TOKEN_EXPIRED', 'Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid access token');
      }
      throw error;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { type: 'refresh' };

      if (decoded.type !== 'refresh') {
        throw ApiError.unauthorized('INVALID_TOKEN_TYPE', 'Token is not a refresh token');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('TOKEN_EXPIRED', 'Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('INVALID_TOKEN', 'Invalid refresh token');
      }
      throw error;
    }
  }

  verifyAccessTokenSync(token: string): TokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { type: 'access' };

    if (decoded.type !== 'access') {
      throw ApiError.unauthorized('INVALID_TOKEN_TYPE', 'Token is not an access token');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  }

  async revokeRefreshToken(_token: string): Promise<void> {
    // В production здесь нужно удалять токен из Redis blacklist
    // или помечать его как отозванный в БД
    // Для базовой реализации оставляем пустым
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        ...payload,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );
  }
}

export const authService = new JwtAuthService();
