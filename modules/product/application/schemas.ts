import { z } from 'zod';
import { paginationSchema } from '@/core/validation';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().max(5000).optional(),
  composition: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  subCategoryId: z.string().uuid('Invalid category ID').optional(),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const getProductSchema = z.object({
  id: paginationSchema.shape.page,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductInput = z.infer<typeof getProductSchema>;
