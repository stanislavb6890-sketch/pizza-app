import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  productName: z.string().min(1, 'Product name is required'),
  productPrice: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive().min(1).max(99),
  imageUrl: z.string().url().optional().or(z.literal('')),
  extras: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
  })).optional().default([]),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().min(1).max(99),
});

export const removeCartItemSchema = z.object({
  uniqueKey: z.string().min(1, 'Unique key is required'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
