import { prisma } from '@/db/prisma';
import { ApiError } from '@/core/errors';

export class DeleteProductUseCase {
  async execute(id: string): Promise<void> {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const deleteProductUseCase = new DeleteProductUseCase();
