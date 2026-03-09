import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import { ApiError } from '@/core/errors';
import type { Product as PrismaProduct } from '@prisma/client';

function mapPrismaProduct(product: PrismaProduct): Product {
  return Product.fromPersistence({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
    weight: product.weight ?? undefined,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    subCategoryId: product.subCategoryId ?? undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  });
}

export class GetProductByIdUseCase {
  async execute(id: string): Promise<Product> {
    const productPrisma = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!productPrisma) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }

    return mapPrismaProduct(productPrisma);
  }
}

export const getProductByIdUseCase = new GetProductByIdUseCase();
