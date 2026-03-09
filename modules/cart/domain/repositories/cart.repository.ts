import type { Cart } from '../entities/cart.entity';

export interface CartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  findBySessionId(sessionId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  delete(userId?: string, sessionId?: string): Promise<void>;
  migrateSessionCartToUser(sessionId: string, userId: string): Promise<Cart>;
}
