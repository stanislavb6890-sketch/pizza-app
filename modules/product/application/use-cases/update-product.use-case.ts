import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import { ApiError } from '@/core/errors';
import type { UpdateProductInput } from '../schemas';
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

export class UpdateProductUseCase {
  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    }

    // Check slug uniqueness if changing slug
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: input.slug },
      });

      if (slugExists) {
        throw ApiError.conflict('SLUG_EXISTS', 'Product with this slug already exists');
      }
    }

    const productPrisma = await prisma.product.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    return mapPrismaProduct(productPrisma);
  }
}

export const updateProductUseCase = new UpdateProductUseCase();
