import { RedisCacheService } from '@/infra/redis';
import { Cart, CartItem } from '@modules/cart/domain';
import type { AddToCartInput } from '../schemas';

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export class AddToCartUseCase {
  private redisService: RedisCacheService;

  constructor() {
    this.redisService = new RedisCacheService();
  }

  async execute(userId: string | undefined, sessionId: string, input: AddToCartInput): Promise<Cart> {
    // Get cart key
    const cartKey = this.getCartKey(userId, sessionId);

    // Try to get existing cart
    let cart = await this.getCart(cartKey);

    if (!cart) {
      cart = userId ? Cart.createForUser(userId) : Cart.createForSession(sessionId);
    }

    // Create or update cart item with extras
    const cartItem = CartItem.create({
      productId: input.productId,
      productName: input.productName,
      productPrice: input.productPrice,
      quantity: input.quantity,
      imageUrl: input.imageUrl,
      extras: input.extras || [],
    });

    cart.addItem(cartItem);

    // Save cart to Redis
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

export const addToCartUseCase = new AddToCartUseCase();
