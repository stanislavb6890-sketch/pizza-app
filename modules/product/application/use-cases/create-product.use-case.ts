import { prisma } from '@/db/prisma';
import { Product } from '@modules/product/domain';
import { ApiError } from '@/core/errors';
import type { CreateProductInput } from '../schemas';
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

export class CreateProductUseCase {
  async execute(input: CreateProductInput): Promise<Product> {
    // Check if slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw ApiError.conflict('SLUG_EXISTS', 'Product with this slug already exists');
    }

    const productPrisma = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageUrl: input.imageUrl,
        price: input.price,
        discountPrice: input.discountPrice,
        weight: input.weight,
        subCategoryId: input.subCategoryId,
        isFeatured: input.isFeatured,
        isAvailable: true,
        sortOrder: 0,
      },
    });

    return mapPrismaProduct(productPrisma);
  }
}

export const createProductUseCase = new CreateProductUseCase();
