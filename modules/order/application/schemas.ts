import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().uuid('Invalid address ID').optional(),
  newAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    building: z.string().min(1, 'Building is required'),
    apartment: z.string().optional(),
    entrance: z.string().optional(),
    floor: z.string().optional(),
    comment: z.string().optional(),
  }).optional(),
  deliveryZoneId: z.string().uuid('Invalid delivery zone ID').optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['card', 'cash']).default('card'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
