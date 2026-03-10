import { RedisCacheService } from '@/infra/redis';
import { Cart, CartItem } from '@modules/cart/domain';
import type { RemoveCartItemInput } from '../schemas';

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export class RemoveFromCartUseCase {
  private redisService: RedisCacheService;

  constructor() {
    this.redisService = new RedisCacheService();
  }

  async execute(userId: string | undefined, sessionId: string, input: RemoveCartItemInput): Promise<Cart> {
    const cartKey = this.getCartKey(userId, sessionId);
    let cart = await this.getCart(cartKey);

    if (!cart) {
      return Cart.createForSession(sessionId);
    }

    cart.removeItem(input.uniqueKey);

    if (cart.isEmpty()) {
      await this.redisService.delete(cartKey);
      return cart;
    }

    await this.saveCart(cartKey, cart);
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
      data.items.map((item: any) => {
        const cartItem = CartItem.create({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          extras: item.extras || [],
        });
        return [cartItem.getUniqueKey(), cartItem];
      })
    );

    return Cart.fromPersistence({
      userId: data.userId,
      sessionId: data.sessionId,
      items,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  private async saveCart(key: string, cart: Cart): Promise<void> {
    await this.redisService.set(key, cart.toJSON(), CART_TTL_SECONDS);
  }
}

export const removeFromCartUseCase = new RemoveFromCartUseCase();
