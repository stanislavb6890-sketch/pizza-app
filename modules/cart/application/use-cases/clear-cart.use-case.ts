import { RedisCacheService } from '@/infra/redis';

export class ClearCartUseCase {
  private redisService: RedisCacheService;

  constructor() {
    this.redisService = new RedisCacheService();
  }

  async execute(userId: string | undefined, sessionId: string): Promise<void> {
    const cartKey = this.getCartKey(userId, sessionId);
    await this.redisService.delete(cartKey);
  }

  private getCartKey(userId: string | undefined, sessionId: string): string {
    if (userId) {
      return `cart:user:${userId}`;
    }
    return `cart:session:${sessionId}`;
  }
}

export const clearCartUseCase = new ClearCartUseCase();
