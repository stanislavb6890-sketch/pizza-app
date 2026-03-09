import { RedisCacheService } from '@/infra/redis';
import { Cart, CartItem } from '@modules/cart/domain';

export class GetCartUseCase {
  private redisService: RedisCacheService;

  constructor() {
    this.redisService = new RedisCacheService();
  }

  async execute(userId: string | undefined, sessionId: string): Promise<Cart> {
    const cartKey = this.getCartKey(userId, sessionId);
    const cart = await this.getCart(cartKey);

    if (!cart) {
      return userId ? Cart.createForUser(userId) : Cart.createForSession(sessionId);
    }

    return cart;
  }

  private getCartKey(userId: string | undefined, sessionId: string): string {
    if (userId) {
      return `cart:user:${userId}`;
    }
    return `cart:session:${sessionId}`;
  }

  private async getCart(key: string): Promise<Cart | null> {
    const data = await this.redisService.get<ReturnType<Cart['toJSON']>>(key);
    
    if (!data) return null;

    const items = new Map(
      data.items.map((item) => [
        item.productId,
        CartItem.create({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        }),
      ])
    );

    return Cart.fromPersistence({
      userId: data.userId,
      sessionId: data.sessionId,
      items,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}

export const getCartUseCase = new GetCartUseCase();
