import { RedisCacheService } from '@/infra/redis';
import { Cart, CartItem } from '@modules/cart/domain';
import type { CartRepository } from '@modules/cart/domain/repositories/cart.repository';

const CART_TTL_SECONDS = 60 * 60 * 24 * 7;

interface CartItemData {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface CartData {
  userId?: string;
  sessionId?: string;
  items: CartItemData[];
  createdAt: string;
  updatedAt: string;
}

export class RedisCartRepository implements CartRepository {
  private cache: RedisCacheService;

  constructor(cache?: RedisCacheService) {
    this.cache = cache || new RedisCacheService();
  }

  private getUserKey(userId: string): string {
    return `cart:user:${userId}`;
  }

  private getSessionKey(sessionId: string): string {
    return `cart:session:${sessionId}`;
  }

  private serializeCart(cart: Cart): CartData {
    return {
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: cart.items.map((item) => item.toJSON()),
      createdAt: cart.toJSON().createdAt.toISOString(),
      updatedAt: cart.toJSON().updatedAt.toISOString(),
    };
  }

  private deserializeCart(data: CartData): Cart {
    const items = new Map<string, CartItem>();
    data.items.forEach((itemData: CartItemData) => {
      items.set(itemData.productId, CartItem.create({
        productId: itemData.productId,
        productName: itemData.productName,
        productPrice: itemData.productPrice,
        quantity: itemData.quantity,
        imageUrl: itemData.imageUrl,
      }));
    });

    return Cart.fromPersistence({
      userId: data.userId,
      sessionId: data.sessionId,
      items,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const data = await this.cache.get<CartData>(this.getUserKey(userId));
    if (!data) return null;
    return this.deserializeCart(data);
  }

  async findBySessionId(sessionId: string): Promise<Cart | null> {
    const data = await this.cache.get<CartData>(this.getSessionKey(sessionId));
    if (!data) return null;
    return this.deserializeCart(data);
  }

  async save(cart: Cart): Promise<Cart> {
    const data = this.serializeCart(cart);
    const key = cart.userId
      ? this.getUserKey(cart.userId)
      : this.getSessionKey(cart.sessionId!);

    await this.cache.set(key, data, CART_TTL_SECONDS);
    return cart;
  }

  async delete(userId?: string, sessionId?: string): Promise<void> {
    if (userId) {
      await this.cache.delete(this.getUserKey(userId));
    }
    if (sessionId) {
      await this.cache.delete(this.getSessionKey(sessionId));
    }
  }

  async migrateSessionCartToUser(sessionId: string, userId: string): Promise<Cart> {
    const sessionCart = await this.findBySessionId(sessionId);
    const userCart = await this.findByUserId(userId);

    if (!sessionCart || sessionCart.isEmpty()) {
      if (userCart) {
        return userCart;
      }
      return Cart.createForUser(userId);
    }

    const mergedCart = Cart.createForUser(userId);

    if (userCart) {
      userCart.items.forEach((item: CartItem) => {
        mergedCart.addItem(item);
      });
    }

    sessionCart.items.forEach((item: CartItem) => {
      mergedCart.addItem(item);
    });

    await this.save(mergedCart);
    await this.delete(sessionId);

    return mergedCart;
  }
}

export const cartRepository = new RedisCartRepository();
